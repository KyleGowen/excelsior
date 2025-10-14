import 'dotenv/config';
import express from 'express';
import { DataSourceConfig } from './config/DataSourceConfig';
import { DeckPersistenceService } from './services/deckPersistence';
import { DatabaseInitializationService } from './services/databaseInitialization';
import { DeckService } from './services/deckService';
import { AuthenticationService } from './services/AuthenticationService';
import { DeckValidationService } from './services/deckValidationService';
import { Character } from './types';
import path from 'path';
import { execSync } from 'child_process';
// Phase 4 Security Imports (commented out for testing)
// import SecurityService from './services/SecurityService';
// import securityMiddleware from './middleware/securityMiddleware';

export const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to detect read-only mode from request
function isReadOnlyMode(req: any): boolean {
  // Check URL parameters for readonly=true
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const readonlyParam = urlParams.get('readonly');
  
  // Check query parameters
  const queryReadonly = req.query.readonly;
  
  // Check headers (for API calls that might pass this in headers)
  const headerReadonly = req.headers['x-readonly-mode'];
  
  return readonlyParam === 'true' || queryReadonly === 'true' || headerReadonly === 'true';
}

// Helper function to block operations in read-only mode
function blockInReadOnlyMode(req: any, res: any, operation: string): boolean {
  if (isReadOnlyMode(req)) {
    console.log(`🔒 SECURITY: Blocking ${operation} - read-only mode detected`);
    res.status(403).json({ 
      success: false, 
      error: `Operation not allowed in read-only mode` 
    });
    return true;
  }
  return false;
}

// Rate limiting for security-sensitive operations
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function checkRateLimit(req: any, res: any, operation: string): boolean {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const key = `${clientIP}:${operation}`;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    console.log(`🔒 SECURITY: Rate limit exceeded for ${operation} from IP ${clientIP}`);
    res.status(429).json({ 
      success: false, 
      error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.` 
    });
    return true;
  }
  
  current.count++;
  return false;
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Initialize services
const deckService = new DeckPersistenceService();
const databaseInit = new DatabaseInitializationService();
const dataSource = DataSourceConfig.getInstance();
const userRepository = dataSource.getUserRepository();
const deckRepository = dataSource.getDeckRepository();
const cardRepository = dataSource.getCardRepository();
const deckValidationService = new DeckValidationService(cardRepository);

// Initialize business logic service
const deckBusinessService = new DeckService(deckRepository);

// Initialize authentication service
const authService = new AuthenticationService(userRepository);

// Function to get git information
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();
    const commitAuthor = execSync('git log -1 --format=%an', { encoding: 'utf8' }).trim();
    const commitEmail = execSync('git log -1 --format=%ae', { encoding: 'utf8' }).trim();
    return { 
      commit, 
      shortCommit,
      branch, 
      commitDate,
      commitMessage,
      commitAuthor,
      commitEmail
    };
  } catch (error) {
    return { 
      commit: 'unknown', 
      shortCommit: 'unknown',
      branch: 'unknown',
      commitDate: 'unknown',
      commitMessage: 'unknown',
      commitAuthor: 'unknown',
      commitEmail: 'unknown'
    };
  }
}

// Middleware
app.use(express.json());

// Phase 4 Security Middleware (commented out for testing)
// app.use(securityMiddleware.securityHeaders);
// app.use(securityMiddleware.inputSanitization);
// app.use(securityMiddleware.sessionSecurity);
// app.use(securityMiddleware.enhancedRateLimit);
// app.use(securityMiddleware.securityMonitoring);
// app.use(securityMiddleware.contentSecurityPolicy);

// Cookie parser middleware
app.use((req: any, res: any, next: any) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    req.cookies = {};
    cookieHeader.split(';').forEach((cookie: string) => {
      const [name, value] = cookie.trim().split('=');
      req.cookies[name] = value;
    });
  }
  next();
});

// Serve card images from resources directory
app.use('/src/resources/cards/images', express.static(path.join(process.cwd(), 'src/resources/cards/images')));

// Serve general images from resources directory
app.use('/src/resources/images', express.static(path.join(process.cwd(), 'src/resources/images')));

// Initialize database
async function initializeServer() {
  try {
    console.log('🔄 Starting server initialization...');
    
    // First, initialize database with Flyway migrations and data
    await databaseInit.initializeDatabase();
    
    // Then initialize the in-memory repositories
    await Promise.all([
      userRepository.initialize(),
      deckRepository.initialize(),
      cardRepository.initialize()
    ]);
    
    console.log('🚀 Excelsior Deckbuilder server running on port', PORT);
    console.log('📖 API documentation available at http://localhost:' + PORT);
    
    const cardStats = await cardRepository.getCardStats();
    console.log('🔍 Database loaded:', cardStats.characters, 'characters,', cardStats.locations, 'locations');
    
    // Start the server
    app.listen(PORT, () => {
      console.log('🌐 Server is listening on port', PORT);
    });
    
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer();

// Authentication middleware
const authenticateUser = authService.createAuthMiddleware();

// User authentication endpoints
app.post('/api/auth/login', (req, res) => authService.handleLogin(req, res));
app.post('/api/auth/logout', (req, res) => authService.handleLogout(req, res));
app.get('/api/auth/me', (req, res) => authService.handleSessionValidation(req, res));

// API Routes
app.get('/api/characters', async (req, res) => {
  try {
    const characters = await cardRepository.getAllCharacters();
    res.json({ success: true, data: characters });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch characters' });
  }
});

app.get('/api/characters/:id/alternate-images', async (req, res) => {
  try {
    const character = await cardRepository.getCharacterById(req.params.id);
    if (!character) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    res.json({ success: true, data: character.alternateImages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
  }
});

app.get('/api/special-cards/:id/alternate-images', async (req, res) => {
  try {
    const specialCard = await cardRepository.getSpecialCardById(req.params.id);
    if (!specialCard) {
      return res.status(404).json({ success: false, error: 'Special card not found' });
    }
    
    res.json({ success: true, data: specialCard.alternateImages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
  }
});

app.get('/api/power-cards/:id/alternate-images', async (req, res) => {
  try {
    const powerCard = await cardRepository.getPowerCardById(req.params.id);
    if (!powerCard) {
      return res.status(404).json({ success: false, error: 'Power card not found' });
    }
    
    res.json({ success: true, data: powerCard.alternateImages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await cardRepository.getAllLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

app.get('/api/special-cards', async (req, res) => {
  try {
    const specialCards = await cardRepository.getAllSpecialCards();
    res.json({ success: true, data: specialCards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch special cards' });
  }
});

app.get('/api/missions', async (req, res) => {
  try {
    const missions = await cardRepository.getAllMissions();
    res.json({ success: true, data: missions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch missions' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await cardRepository.getAllEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

app.get('/api/aspects', async (req, res) => {
  try {
    const aspects = await cardRepository.getAllAspects();
    res.json({ success: true, data: aspects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch aspects' });
  }
});

app.get('/api/advanced-universe', async (req, res) => {
  try {
    const advancedUniverse = await cardRepository.getAllAdvancedUniverse();
    res.json({ success: true, data: advancedUniverse });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch advanced universe' });
  }
});

app.get('/api/teamwork', async (req, res) => {
  try {
    const teamwork = await cardRepository.getAllTeamwork();
    res.json({ success: true, data: teamwork });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teamwork' });
  }
});

app.get('/api/ally-universe', async (req, res) => {
  try {
    const ally = await cardRepository.getAllAllyUniverse();
    res.json({ success: true, data: ally });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch ally universe' });
  }
});

app.get('/api/training', async (req, res) => {
  try {
    const training = await cardRepository.getAllTraining();
    res.json({ success: true, data: training });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch training cards' });
  }
});

app.get('/api/basic-universe', async (req, res) => {
  try {
    const basicUniverse = await cardRepository.getAllBasicUniverse();
    res.json({ success: true, data: basicUniverse });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch basic universe cards' });
  }
});

app.get('/api/power-cards', async (req, res) => {
  try {
    const powerCards = await cardRepository.getAllPowerCards();
    res.json({ success: true, data: powerCards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch power cards' });
  }
});

app.get('/test', async (req, res) => {
  const characters = await cardRepository.getAllCharacters();
  const locations = await cardRepository.getAllLocations();
  const cardStats = await cardRepository.getCardStats();
  
  res.json({
    characters: characters.length,
    locations: locations.length,
    stats: cardStats,
    sampleLocation: locations[0]
  });
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateUser, async (req: any, res) => {
  try {
    // Check if the current user is an ADMIN
    const currentUser = req.user;
    if (currentUser.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only ADMIN users can create new users' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await userRepository.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    // Create the new user with USER role by default
    const newUser = await userRepository.createUser(username, `${username}@example.com`, password, 'USER');
    
    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = newUser as any;
    
    res.status(201).json({ 
      success: true, 
      data: userWithoutPassword,
      message: `User "${username}" created successfully`
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Change password endpoint - USER and ADMIN only
app.post('/api/users/change-password', authenticateUser, async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || (currentUser.role !== 'USER' && currentUser.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, error: 'Only USER or ADMIN may change password' });
    }

    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    const updated = await userRepository.updateUserPassword(currentUser.id, newPassword);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

app.get('/api/decks', authenticateUser, async (req: any, res) => {
  try {
    const decks = await deckRepository.getDecksByUserId(req.user.id);
    
    // Transform deck data to match frontend expectations
    // Note: getDecksByUserId now returns decks with metadata columns for performance
    const transformedDecks = decks.map(deck => ({
      metadata: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        created: deck.created_at,
        lastModified: deck.updated_at,
        cardCount: deck.card_count || 0, // Use metadata column instead of cards.length
        threat: deck.threat || 0, // Use metadata column
        is_valid: deck.is_valid || false, // Use metadata column
        userId: deck.user_id,
        uiPreferences: deck.ui_preferences,
        is_limited: deck.is_limited
      },
      cards: deck.cards || [] // Character and location cards from metadata
    }));
    
    res.json({ success: true, data: transformedDecks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch decks' });
  }
});

// Deck management API routes
app.post('/api/decks', authenticateUser, /* securityMiddleware.csrfProtection, securityMiddleware.securityAudit('DECK_CREATION'), */ async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for deck creation
    if (checkRateLimit(req, res, 'deck creation')) {
      return;
    }
    
    // SECURITY: Block deck creation in read-only mode
    if (blockInReadOnlyMode(req, res, 'deck creation')) {
      return;
    }
    
    // Check if user is guest - guests cannot create decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking deck creation - guest user attempted to create deck');
      return res.status(403).json({ success: false, error: 'Guests may not create decks' });
    }
    
    const { name, description, characters } = req.body;
    
    // SECURITY: Comprehensive input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Deck name is required and must be a non-empty string' });
    }
    
    if (name.length > 100) {
      return res.status(400).json({ success: false, error: 'Deck name must be 100 characters or less' });
    }
    
    if (description && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ success: false, error: 'Description must be a string with 500 characters or less' });
    }
    
    if (characters && (!Array.isArray(characters) || characters.length > 50)) {
      return res.status(400).json({ success: false, error: 'Characters must be an array with 50 items or less' });
    }
    
    const deck = await deckBusinessService.createDeck(req.user.id, name, description, characters);
    res.status(201).json({ success: true, data: deck });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Maximum 4 characters allowed')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    console.error('Error creating deck:', error);
    res.status(500).json({ success: false, error: 'Failed to create deck' });
  }
});

// Deck validation endpoint
app.post('/api/decks/validate', authenticateUser, async (req: any, res) => {
  try {
    const { cards } = req.body;
    
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cards array is required' 
      });
    }

    const validationErrors = await deckValidationService.validateDeck(cards);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.map(err => err.message).join('; '),
        validationErrors: validationErrors
      });
    }

    res.json({ success: true, message: 'Deck is valid' });
  } catch (error) {
    console.error('Error validating deck:', error);
    res.status(500).json({ success: false, error: 'Failed to validate deck' });
  }
});

app.get('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    const isOwner = deck.user_id === req.user.id;
    
    // Add ownership flag to response for frontend to use
    const deckData = {
      ...deck,
      isOwner: isOwner
    };
    
    // Transform deck data to match frontend expectations
    const transformedDeck = {
      metadata: {
        id: deckData.id,
        name: deckData.name,
        description: deckData.description,
        created: deckData.created_at,
        lastModified: deckData.updated_at,
        cardCount: deckData.cards?.length || 0,
        userId: deckData.user_id,
        uiPreferences: deckData.ui_preferences,
        isOwner: deckData.isOwner,
        is_limited: deckData.is_limited,
        reserve_character: deckData.reserve_character
      },
      cards: deckData.cards || []
    };
    
    res.json({ success: true, data: transformedDeck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deck' });
  }
});

// Background loading endpoint for full deck data (including all card types)
app.get('/api/decks/:id/full', authenticateUser, async (req: any, res) => {
  try {
    const deck = await deckRepository.getDeckSummaryWithAllCards(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    const isOwner = deck.user_id === req.user.id;
    
    // Add ownership flag to response for frontend to use
    const deckData = {
      ...deck,
      isOwner: isOwner
    };
    
    // Transform deck data to match frontend expectations
    const transformedDeck = {
      metadata: {
        id: deckData.id,
        name: deckData.name,
        description: deckData.description,
        created: deckData.created_at,
        lastModified: deckData.updated_at,
        cardCount: deckData.cards?.length || 0,
        userId: deckData.user_id,
        uiPreferences: deckData.ui_preferences,
        isOwner: deckData.isOwner,
        is_limited: deckData.is_limited,
        reserve_character: deckData.reserve_character
      },
      cards: deckData.cards || []
    };
    
    res.json({ success: true, data: transformedDeck });
  } catch (error) {
    console.error('Error fetching full deck data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch full deck data' });
  }
});

app.put('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for deck update
    if (checkRateLimit(req, res, 'deck update')) {
      return;
    }
    
    // SECURITY: Block deck update in read-only mode
    if (blockInReadOnlyMode(req, res, 'deck update')) {
      return;
    }
    
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking deck update - guest user attempted to modify deck');
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { name, description, is_limited, is_valid, reserve_character } = req.body;
    
    // SECURITY: Comprehensive input validation
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ success: false, error: 'Deck name must be a non-empty string' });
    }
    
    if (name && name.length > 100) {
      return res.status(400).json({ success: false, error: 'Deck name must be 100 characters or less' });
    }
    
    if (description !== undefined && description !== null && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ success: false, error: 'Description must be a string with 500 characters or less' });
    }
    
    if (is_limited !== undefined && typeof is_limited !== 'boolean') {
      return res.status(400).json({ success: false, error: 'is_limited must be a boolean value' });
    }
    
    if (is_valid !== undefined && typeof is_valid !== 'boolean') {
      return res.status(400).json({ success: false, error: 'is_valid must be a boolean value' });
    }
    
    if (reserve_character !== undefined && reserve_character !== null && (typeof reserve_character !== 'string' || reserve_character.length > 50)) {
      return res.status(400).json({ success: false, error: 'Reserve character must be a string with 50 characters or less' });
    }
    
    // Check if deck exists
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // SECURITY: Check if user owns this deck
    if (deck.user_id !== req.user.id) {
      console.log('🔒 SECURITY: Blocking deck update - user does not own this deck');
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const updatedDeck = await deckRepository.updateDeck(req.params.id, { name, description, is_limited, is_valid, reserve_character });
    if (!updatedDeck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    const isOwner = updatedDeck.user_id === req.user.id;
    
    // Add ownership flag to response for frontend to use
    const deckData = {
      ...updatedDeck,
      isOwner: isOwner
    };
    
    // Transform deck data to match frontend expectations (same as GET endpoint)
    const transformedDeck = {
      metadata: {
        id: deckData.id,
        name: deckData.name,
        description: deckData.description,
        created: deckData.created_at,
        lastModified: deckData.updated_at,
        cardCount: deckData.cards?.length || 0,
        userId: deckData.user_id,
        uiPreferences: deckData.ui_preferences,
        isOwner: deckData.isOwner,
        is_limited: deckData.is_limited,
        reserve_character: deckData.reserve_character
      },
      cards: deckData.cards || []
    };
    
    res.json({ success: true, data: transformedDeck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update deck' });
  }
});

app.delete('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for deck deletion
    if (checkRateLimit(req, res, 'deck deletion')) {
      return;
    }
    
    // SECURITY: Block deck deletion in read-only mode
    if (blockInReadOnlyMode(req, res, 'deck deletion')) {
      return;
    }
    
    // Check if user is guest - guests cannot delete decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking deck deletion - guest user attempted to delete deck');
      return res.status(403).json({ success: false, error: 'Guests may not delete decks' });
    }

    // Check if deck exists
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    // SECURITY: Check if user owns this deck
    if (deck.user_id !== req.user.id) {
      console.log('🔒 SECURITY: Blocking deck deletion - user does not own this deck');
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }

    const success = await deckRepository.deleteDeck(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete deck' });
  }
});

app.post('/api/decks/:id/cards', authenticateUser, /* securityMiddleware.csrfProtection, securityMiddleware.securityAudit('CARD_ADDITION'), */ async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for card addition
    if (checkRateLimit(req, res, 'card addition')) {
      return;
    }
    
    // SECURITY: Block card addition in read-only mode
    if (blockInReadOnlyMode(req, res, 'card addition')) {
      return;
    }
    
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking card addition - guest user attempted to modify deck');
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { cardType, cardId, quantity, selectedAlternateImage } = req.body;
    
    // SECURITY: Comprehensive input validation
    if (!cardType || typeof cardType !== 'string' || cardType.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Card type is required and must be a non-empty string' });
    }
    
    if (!cardId || typeof cardId !== 'string' || cardId.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Card ID is required and must be a non-empty string' });
    }
    
    if (cardType.length > 50) {
      return res.status(400).json({ success: false, error: 'Card type must be 50 characters or less' });
    }
    
    if (cardId.length > 100) {
      return res.status(400).json({ success: false, error: 'Card ID must be 100 characters or less' });
    }
    
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 1 || quantity > 10)) {
      return res.status(400).json({ success: false, error: 'Quantity must be a number between 1 and 10' });
    }
    
    if (selectedAlternateImage !== undefined && selectedAlternateImage !== null && (typeof selectedAlternateImage !== 'string' || selectedAlternateImage.length > 200)) {
      return res.status(400).json({ success: false, error: 'Selected alternate image must be a string with 200 characters or less' });
    }
    
    // SECURITY: Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(req.params.id, req.user.id)) {
      console.log('🔒 SECURITY: Blocking card addition - user does not own this deck');
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = await deckRepository.addCardToDeck(req.params.id, cardType, cardId, quantity || 1, selectedAlternateImage);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found or failed to add card' });
    }
    
    // Return the updated deck
    const updatedDeck = await deckRepository.getDeckById(req.params.id);
    res.json({ success: true, data: updatedDeck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add card to deck' });
  }
});

// Bulk replace all cards in a deck (used for save operations)
app.put('/api/decks/:id/cards', authenticateUser, async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for card replacement
    if (checkRateLimit(req, res, 'card replacement')) {
      return;
    }
    
    // SECURITY: Block card replacement in read-only mode
    if (blockInReadOnlyMode(req, res, 'card replacement')) {
      return;
    }
    
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking card replacement - guest user attempted to modify deck');
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { cards } = req.body;
    
    // SECURITY: Comprehensive input validation
    if (!Array.isArray(cards)) {
      return res.status(400).json({ success: false, error: 'Cards must be an array' });
    }
    
    if (cards.length > 100) {
      return res.status(400).json({ success: false, error: 'Cannot replace more than 100 cards at once' });
    }
    
    // Validate each card in the array
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card || typeof card !== 'object') {
        return res.status(400).json({ success: false, error: `Card at index ${i} must be an object` });
      }
      
      if (!card.cardType || typeof card.cardType !== 'string' || card.cardType.trim().length === 0) {
        return res.status(400).json({ success: false, error: `Card at index ${i}: cardType is required and must be a non-empty string` });
      }
      
      if (!card.cardId || typeof card.cardId !== 'string' || card.cardId.trim().length === 0) {
        return res.status(400).json({ success: false, error: `Card at index ${i}: cardId is required and must be a non-empty string` });
      }
      
      if (card.quantity !== undefined && (typeof card.quantity !== 'number' || card.quantity < 1 || card.quantity > 10)) {
        return res.status(400).json({ success: false, error: `Card at index ${i}: quantity must be a number between 1 and 10` });
      }
    }
    
    // SECURITY: Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(req.params.id, req.user.id)) {
      console.log('🔒 SECURITY: Blocking card replacement - user does not own this deck');
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = await deckRepository.replaceAllCardsInDeck(req.params.id, cards);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found or failed to replace cards' });
    }
    
    // Return the updated deck
    const updatedDeck = await deckRepository.getDeckById(req.params.id);
    res.json({ success: true, data: updatedDeck });
  } catch (error) {
    console.error('Error replacing cards in deck:', error);
    res.status(500).json({ success: false, error: 'Failed to replace cards in deck' });
  }
});

app.delete('/api/decks/:id/cards', authenticateUser, async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for card removal
    if (checkRateLimit(req, res, 'card removal')) {
      return;
    }
    
    // SECURITY: Block card removal in read-only mode
    if (blockInReadOnlyMode(req, res, 'card removal')) {
      return;
    }
    
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking card removal - guest user attempted to modify deck');
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { cardType, cardId, quantity } = req.body;
    
    // SECURITY: Comprehensive input validation
    if (!cardType || typeof cardType !== 'string' || cardType.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Card type is required and must be a non-empty string' });
    }
    
    if (!cardId || typeof cardId !== 'string' || cardId.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Card ID is required and must be a non-empty string' });
    }
    
    if (cardType.length > 50) {
      return res.status(400).json({ success: false, error: 'Card type must be 50 characters or less' });
    }
    
    if (cardId.length > 100) {
      return res.status(400).json({ success: false, error: 'Card ID must be 100 characters or less' });
    }
    
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 1 || quantity > 10)) {
      return res.status(400).json({ success: false, error: 'Quantity must be a number between 1 and 10' });
    }
    
    // SECURITY: Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(req.params.id, req.user.id)) {
      console.log('🔒 SECURITY: Blocking card removal - user does not own this deck');
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    let success;
    
    // Special case: clear all cards
    if (cardType === 'all' && cardId === 'all') {
      success = await deckRepository.removeAllCardsFromDeck(req.params.id);
    } else {
      success = await deckRepository.removeCardFromDeck(req.params.id, cardType, cardId, quantity || 1);
    }
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found or failed to remove card' });
    }
    
    // Return the updated deck
    const updatedDeck = await deckRepository.getDeckById(req.params.id);
    res.json({ success: true, data: updatedDeck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove card from deck' });
  }
});

app.get('/api/deck-stats', authenticateUser, async (req: any, res) => {
  try {
    const userDecks = await deckRepository.getDecksByUserId(req.user.id);
    const totalDecks = userDecks.length;
    
    // Load full deck data including cards for each deck
    const decksWithCards = await Promise.all(userDecks.map(async (deck) => {
      const fullDeck = await deckRepository.getDeckById(deck.id);
      return fullDeck || deck;
    }));
    
    // Calculate total cards across all decks
    const totalCards = decksWithCards.reduce((total, deck) => {
      if (deck.cards) {
        return total + deck.cards.reduce((deckTotal, card) => deckTotal + (card.quantity || 1), 0);
      }
      return total;
    }, 0);
    
    // Calculate average cards per deck
    const averageCardsPerDeck = totalDecks > 0 ? Math.round(totalCards / totalDecks) : 0;
    
    // Find largest deck size
    const largestDeckSize = decksWithCards.reduce((max, deck) => {
      if (deck.cards) {
        const deckSize = deck.cards.reduce((deckTotal, card) => deckTotal + (card.quantity || 1), 0);
        return Math.max(max, deckSize);
      }
      return max;
    }, 0);
    
    const stats = { 
      totalDecks, 
      totalCards, 
      averageCardsPerDeck, 
      largestDeckSize 
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deck stats' });
  }
});

// UI Preferences API routes
app.get('/api/decks/:id/ui-preferences', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(id, req.user.id)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const preferences = await deckRepository.getUIPreferences(id);
    res.json({ success: true, data: preferences || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch UI preferences' });
  }
});

app.put('/api/decks/:id/ui-preferences', authenticateUser, async (req: any, res) => {
  try {
    // SECURITY: Rate limiting for UI preferences save
    if (checkRateLimit(req, res, 'UI preferences save')) {
      return;
    }
    
    // SECURITY: Block UI preferences save in read-only mode
    if (blockInReadOnlyMode(req, res, 'UI preferences save')) {
      return;
    }
    
    // SECURITY: Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      console.log('🔒 SECURITY: Blocking UI preferences save - guest user attempted to modify deck');
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { id } = req.params;
    const preferences = req.body;
    
    // SECURITY: Comprehensive input validation
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ success: false, error: 'Preferences must be an object' });
    }
    
    // Validate specific preference fields if they exist
    if (preferences.viewMode && !['tile', 'list'].includes(preferences.viewMode)) {
      return res.status(400).json({ success: false, error: 'viewMode must be either "tile" or "list"' });
    }
    
    if (preferences.sortBy && (typeof preferences.sortBy !== 'string' || preferences.sortBy.length > 50)) {
      return res.status(400).json({ success: false, error: 'sortBy must be a string with 50 characters or less' });
    }
    
    if (preferences.filterBy && (typeof preferences.filterBy !== 'string' || preferences.filterBy.length > 50)) {
      return res.status(400).json({ success: false, error: 'filterBy must be a string with 50 characters or less' });
    }
    
    // Limit the size of the preferences object
    const preferencesString = JSON.stringify(preferences);
    if (preferencesString.length > 1000) {
      return res.status(400).json({ success: false, error: 'Preferences object is too large (max 1000 characters)' });
    }
    
    // Check if deck exists
    const deck = await deckRepository.getDeckById(id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // SECURITY: Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(id, req.user.id)) {
      console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = await deckRepository.updateUIPreferences(id, preferences);
    if (success) {
      res.json({ success: true, data: preferences });
    } else {
      res.status(404).json({ success: false, error: 'Deck not found' });
    }
  } catch (error) {
    console.error('Error updating UI preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to update UI preferences' });
  }
});

// Main page route - displays characters table
// Main application route - serves the app with login modal
app.get('/', (req, res) => {
  // Add cache-busting headers to prevent HTML caching during development
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Deck Builder route (Image 2)
app.get('/users/:userId/decks', authenticateUser, (req: any, res) => {
  const { userId } = req.params;
  const user = req.user;
  
  // Check if user has access to this route
  const isGuestAccess = userId === 'guest' && user.role === 'GUEST';
  const isOwnAccess = user.id === userId;
  
  if (!isGuestAccess && !isOwnAccess) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Deck Editor route - serve deck editor for specific deck (no auth required for read-only viewing)
app.get('/users/:userId/decks/:deckId', (req: any, res) => {
  const { userId, deckId } = req.params;
  
  // Add cache-busting headers to prevent HTML caching during development
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`
  });
  
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Database View route (Image 3) - serve original database view
app.get('/data', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Static file serving for non-conflicting paths
app.use('/public', express.static('public'));
// Serve static files with cache-busting for JS files
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));
app.use('/src/resources', express.static('src/resources'));

// Phase 4 Security Dashboard endpoint (commented out for testing)
// app.get('/api/security/stats', authenticateUser, async (req: any, res) => {
//   try {
//     // Only allow admin users to access security stats
//     if (req.user?.role !== 'ADMIN') {
//       return res.status(403).json({
//         success: false,
//         error: 'Access denied. Admin privileges required.'
//       });
//     }

//     const securityService = SecurityService.getInstance();
//     const stats = securityService.getSecurityStats();
    
//     res.json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     console.error('Error fetching security stats:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch security statistics'
//     });
//   }
// });

// CSRF Token endpoint (commented out for testing)
// app.get('/api/security/csrf-token', authenticateUser, async (req: any, res) => {
//   try {
//     const securityService = SecurityService.getInstance();
//     const token = securityService.generateCSRFToken(req.user.id, req.sessionID);
    
//     res.json({
//       success: true,
//       csrfToken: token
//     });
//   } catch (error) {
//     console.error('Error generating CSRF token:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate CSRF token'
//     });
//   }
// });

// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const gitInfo = getGitInfo();
  const healthData: any = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    git: {
      commit: gitInfo.commit,
      shortCommit: gitInfo.shortCommit,
      branch: gitInfo.branch,
      commitDate: gitInfo.commitDate,
      commitMessage: gitInfo.commitMessage,
      commitAuthor: gitInfo.commitAuthor,
      commitEmail: gitInfo.commitEmail,
    }
  };

  try {
    // System resource information
    const memUsage = process.memoryUsage();
    healthData.resources = {
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      },
      cpu: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };

    // Database health check
    try {
      const dbStartTime = Date.now();
      
      // Test database connection
      const pool = (dataSource as any).pool;
      const client = await pool.connect();
      
      // Check if GUEST user exists
      const guestUserResult = await client.query(
        'SELECT id, username, role FROM users WHERE role = $1 OR username = $2',
        ['GUEST', 'guest']
      );
      
      // Count total guest decks
      const guestDecksResult = await client.query(
        'SELECT COUNT(*) as count FROM decks WHERE user_id IN (SELECT id FROM users WHERE role = $1 OR username = $2)',
        ['GUEST', 'guest']
      );
      
      // Get database stats
      const dbStatsResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM decks) as total_decks,
          (SELECT COUNT(*) FROM deck_cards) as total_deck_cards,
          (SELECT COUNT(*) FROM characters) as total_characters,
          (SELECT COUNT(*) FROM special_cards) as total_special_cards,
          (SELECT COUNT(*) FROM power_cards) as total_power_cards
      `);
      
      // Get latest migration information
      const migrationResult = await client.query(`
        SELECT 
          version,
          description,
          type,
          script,
          checksum,
          installed_by,
          installed_on,
          execution_time,
          success,
          installed_rank
        FROM flyway_schema_history 
        ORDER BY installed_rank DESC 
        LIMIT 1
      `);
      
      // Get total migration count
      const migrationCountResult = await client.query(`
        SELECT COUNT(*) as total_migrations FROM flyway_schema_history
      `);
      
      // Get migration status summary
      const migrationStatusResult = await client.query(`
        SELECT 
          COUNT(CASE WHEN success = true THEN 1 END) as successful_migrations,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_migrations,
          MAX(installed_on) as last_migration_date
        FROM flyway_schema_history
      `);
      
      client.release();
      
      const dbLatency = Date.now() - dbStartTime;
      
      healthData.database = {
        status: 'OK',
        latency: `${dbLatency}ms`,
        connection: 'Active',
        guestUser: {
          exists: guestUserResult.rows.length > 0,
          count: guestUserResult.rows.length,
          users: guestUserResult.rows.map((row: any) => ({
            id: row.id,
            username: row.username,
            role: row.role
          }))
        },
        guestDecks: {
          total: parseInt(guestDecksResult.rows[0].count)
        },
        stats: {
          totalUsers: parseInt(dbStatsResult.rows[0].total_users),
          totalDecks: parseInt(dbStatsResult.rows[0].total_decks),
          totalDeckCards: parseInt(dbStatsResult.rows[0].total_deck_cards),
          totalCharacters: parseInt(dbStatsResult.rows[0].total_characters),
          totalSpecialCards: parseInt(dbStatsResult.rows[0].total_special_cards),
          totalPowerCards: parseInt(dbStatsResult.rows[0].total_power_cards)
        },
        migrations: {
          latest: migrationResult.rows.length > 0 ? {
            version: migrationResult.rows[0].version,
            description: migrationResult.rows[0].description,
            type: migrationResult.rows[0].type,
            script: migrationResult.rows[0].script,
            checksum: migrationResult.rows[0].checksum,
            installedBy: migrationResult.rows[0].installed_by,
            installedOn: migrationResult.rows[0].installed_on,
            executionTime: migrationResult.rows[0].execution_time,
            success: migrationResult.rows[0].success,
            installedRank: migrationResult.rows[0].installed_rank
          } : null,
        }
      };
      
    } catch (dbError) {
      healthData.database = {
        status: 'ERROR',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        connection: 'Failed'
      };
      healthData.status = 'DEGRADED';
    }


    // Calculate total response time
    const totalLatency = Date.now() - startTime;
    healthData.latency = `${totalLatency}ms`;

    // Determine overall status
    if (healthData.database.status === 'ERROR') {
      healthData.status = 'ERROR';
    }

    // Set appropriate HTTP status code
    const httpStatus = healthData.status === 'OK' ? 200 : 
                      healthData.status === 'DEGRADED' ? 200 : 503;

    res.status(httpStatus).json(healthData);

  } catch (error) {
    // Critical error - server is unhealthy
    healthData.status = 'ERROR';
    healthData.error = error instanceof Error ? error.message : 'Unknown error';
    healthData.latency = `${Date.now() - startTime}ms`;
    
    res.status(503).json(healthData);
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const isValid = await databaseInit.validateDatabase();
    const isUpToDate = await databaseInit.checkDatabaseStatus();
    
    res.json({
      status: 'OK',
      database: {
        valid: isValid,
        upToDate: isUpToDate,
        migrations: 'Flyway managed'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Phase 4 Security Error Handler (commented out for testing)
// app.use(securityMiddleware.securityErrorHandler);

// Server startup is now handled in initializeServer() function

// Export app for testing
export default app;

