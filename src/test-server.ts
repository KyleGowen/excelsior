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

export const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware
app.use(express.json());

// Authentication middleware
const authenticateUser = authService.createAuthMiddleware();

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

// Serve global nav component files
app.get('/components/globalNav.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'components', 'globalNav.html'));
});

app.get('/components/globalNav.css', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'components', 'globalNav.css'));
});

app.get('/components/globalNav.js', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'components', 'globalNav.js'));
});

// Initialize database for tests
export async function initializeTestServer() {
  try {
    console.log('🔄 Starting test server initialization...');
    console.log('🔍 CI_DEBUG_2025_01_07_V2 - Test server code is being used');
    
    // First, initialize database with Flyway migrations and data
    await databaseInit.initializeDatabase();
    
    // Then initialize the repositories
    await Promise.all([
      userRepository.initialize(),
      deckRepository.initialize(),
      cardRepository.initialize()
    ]);
    
    console.log('✅ Test server repositories initialized');
    
    // Return the app without starting the server
    return app;
    
  } catch (error) {
    console.error('❌ Test server initialization failed:', error);
    throw error;
  }
}

// API Routes (copied from main index.ts)
app.get('/api/characters', async (req, res) => {
  try {
    const characters = await cardRepository.getAllCharacters();
    res.json({ success: true, data: characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch characters' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await cardRepository.getAllLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

app.get('/api/special-cards', async (req, res) => {
  try {
    const specialCards = await cardRepository.getAllSpecialCards();
    res.json({ success: true, data: specialCards });
  } catch (error) {
    console.error('Error fetching special cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch special cards' });
  }
});

app.get('/api/power-cards', async (req, res) => {
  try {
    const powerCards = await cardRepository.getAllPowerCards();
    res.json({ success: true, data: powerCards });
  } catch (error) {
    console.error('Error fetching power cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch power cards' });
  }
});

app.get('/api/missions', async (req, res) => {
  try {
    const missions = await cardRepository.getAllMissions();
    res.json({ success: true, data: missions });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch missions' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await cardRepository.getAllEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

app.get('/api/aspects', async (req, res) => {
  try {
    const aspects = await cardRepository.getAllAspects();
    res.json({ success: true, data: aspects });
  } catch (error) {
    console.error('Error fetching aspects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch aspects' });
  }
});

app.get('/api/advanced-universe', async (req, res) => {
  try {
    const advancedUniverse = await cardRepository.getAllAdvancedUniverse();
    res.json({ success: true, data: advancedUniverse });
  } catch (error) {
    console.error('Error fetching advanced universe cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch advanced universe cards' });
  }
});

app.get('/api/teamwork', async (req, res) => {
  try {
    const teamwork = await cardRepository.getAllTeamwork();
    res.json({ success: true, data: teamwork });
  } catch (error) {
    console.error('Error fetching teamwork cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch teamwork cards' });
  }
});

app.get('/api/ally-universe', async (req, res) => {
  try {
    const allyUniverse = await cardRepository.getAllAllyUniverse();
    res.json({ success: true, data: allyUniverse });
  } catch (error) {
    console.error('Error fetching ally universe cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ally universe cards' });
  }
});

app.get('/api/training', async (req, res) => {
  try {
    const training = await cardRepository.getAllTraining();
    res.json({ success: true, data: training });
  } catch (error) {
    console.error('Error fetching training cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch training cards' });
  }
});

app.get('/api/basic-universe', async (req, res) => {
  try {
    const basicUniverse = await cardRepository.getAllBasicUniverse();
    res.json({ success: true, data: basicUniverse });
  } catch (error) {
    console.error('Error fetching basic universe cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch basic universe cards' });
  }
});

// Authentication routes
app.post('/api/auth/login', authService.handleLogin.bind(authService));
app.post('/api/auth/logout', authService.handleLogout.bind(authService));
app.get('/api/auth/me', authService.handleSessionValidation.bind(authService));

// User management routes
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

// Change password for tests
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
    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// Deck routes
app.get('/api/decks', authenticateUser, async (req: any, res) => {
  try {
    const decks = await deckRepository.getDecksByUserId(req.user.id);
    
    // Transform deck data to match frontend expectations
    // Note: getDecksByUserId now returns decks with only character/location cards for performance
    const transformedDecks = decks.map(deck => ({
      metadata: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        created: deck.created_at,
        lastModified: deck.updated_at,
        cardCount: deck.cards?.length || 0,
        userId: deck.user_id,
        uiPreferences: deck.ui_preferences,
        is_limited: deck.is_limited
      },
      cards: deck.cards || []
    }));
    
    res.json({ success: true, data: transformedDecks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch decks' });
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
    
    // Transform deck data to match frontend expectations (same as main server)
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
        is_limited: deckData.is_limited
      },
      cards: deckData.cards || []
    };
    
    res.json({ success: true, data: transformedDeck });
  } catch (error) {
    console.error('Error fetching full deck data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch full deck data' });
  }
});

app.post('/api/decks', authenticateUser, async (req: any, res) => {
  try {
    console.log('🔍 POST /api/decks - Starting deck creation');
    console.log('🔍 User:', { id: req.user.id, role: req.user.role });
    console.log('🔍 Request body:', { name: req.body.name, description: req.body.description, characterIds: req.body.characterIds, characters: req.body.characters });
    
    // Check if user is guest - guests cannot create decks
    if (req.user.role === 'GUEST') {
      console.log('❌ Guest user attempted to create deck');
      return res.status(403).json({ success: false, error: 'Guests may not create decks' });
    }
    
    const { name, description, characterIds, characters } = req.body;
    const userId = req.user.id; // Use authenticated user's ID
    
    // Check both characterIds and characters fields for validation
    const characterArray = characterIds || characters;
    
    console.log('🔍 Character array:', characterArray);
    
    // Validate character limit
    if (characterArray && characterArray.length > 4) {
      console.log('❌ Character limit exceeded:', characterArray.length);
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 4 characters allowed per deck' 
      });
    }
    
    console.log('🔍 Calling deckRepository.createDeck with:', { userId, name, description, characterArray });
    const deck = await deckRepository.createDeck(userId, name, description, characterArray);
    console.log('✅ Deck created successfully:', { id: deck.id, name: deck.name });
    res.status(201).json({ success: true, data: deck });
  } catch (error) {
    console.error('❌ Error creating deck:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Include error details in response for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create deck',
      details: errorDetails,
      debugInfo: 'CI_DEBUG_2025_01_07_V2' // Unique identifier to verify code is being used
    });
  }
});

app.put('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { name, description, is_limited, reserve_character } = req.body;
    
    // Handle empty string for reserve_character (convert to null)
    const processedReserveCharacter = (reserve_character === '' || reserve_character === undefined) ? null : reserve_character;
    
    // Check if deck exists
    const existingDeck = await deckRepository.getDeckById(req.params.id);
    if (!existingDeck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    if (existingDeck.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const deck = await deckRepository.updateDeck(req.params.id, { name, description, is_limited, reserve_character: processedReserveCharacter });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Transform deck data to match frontend expectations (same as GET endpoint)
    const transformedDeck = {
      metadata: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        created: deck.created_at,
        lastModified: deck.updated_at,
        cardCount: deck.cards?.length || 0,
        userId: deck.user_id,
        uiPreferences: deck.ui_preferences,
        isOwner: true, // User owns the deck since they can update it
        is_limited: deck.is_limited,
        reserve_character: deck.reserve_character
      },
      cards: deck.cards || []
    };
    
    res.json({ success: true, data: transformedDeck });
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ success: false, error: 'Failed to update deck' });
  }
});

app.delete('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    // Check if user is guest - guests cannot delete decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not delete decks' });
    }
    
    // Check if deck exists
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = await deckRepository.deleteDeck(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ success: false, error: 'Failed to delete deck' });
  }
});

// Deck cards routes
app.get('/api/decks/:id/cards', async (req, res) => {
  try {
    const cards = await deckRepository.getDeckCards(req.params.id);
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Error fetching deck cards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deck cards' });
  }
});

app.post('/api/decks/:id/cards', authenticateUser, async (req: any, res) => {
  try {
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    // Check if user owns this deck
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck || deck.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const { cardType, cardId, quantity, selectedAlternateImage } = req.body;
    const success = await deckRepository.addCardToDeck(req.params.id, cardType, cardId, quantity, selectedAlternateImage);
    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to add card to deck' });
    }
    res.json({ success: true, message: 'Card added to deck successfully' });
  } catch (error) {
    console.error('Error adding card to deck:', error);
    res.status(500).json({ success: false, error: 'Failed to add card to deck' });
  }
});

app.delete('/api/decks/:id/cards', authenticateUser, async (req: any, res) => {
  try {
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    // Check if user owns this deck
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck || deck.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const { cardType, cardId, quantity } = req.body;
    const success = await deckRepository.removeCardFromDeck(req.params.id, cardType, cardId, quantity);
    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to remove card from deck' });
    }
    res.json({ success: true, message: 'Card removed from deck successfully' });
  } catch (error) {
    console.error('Error removing card from deck:', error);
    res.status(500).json({ success: false, error: 'Failed to remove card from deck' });
  }
});

// UI Preferences API routes
app.get('/api/decks/:id/ui-preferences', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Check if deck exists
    const deck = await deckRepository.getDeckById(id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Allow guests to view UI preferences (read-only access)
    // Only check ownership for non-guests
    if (req.user.role !== 'GUEST' && !await deckRepository.userOwnsDeck(id, req.user.id)) {
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
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { id } = req.params;
    const preferences = req.body;
    
    // Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(id, req.user.id)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    await deckRepository.updateUIPreferences(id, preferences);
    res.json({ success: true, message: 'UI preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update UI preferences' });
  }
});

// Serve static files
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Serve deck builder
app.get('/deck-builder', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'deck-builder.html'));
});

app.get('/deck-builder.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'deck-builder.html'));
});

// Serve database view
app.get('/database-view', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'database-view.html'));
});

// Legacy/alternate database route used in some tests
app.get('/database', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'database-view.html'));
});

// Deck Builder route for specific user - serve app HTML (no auth required in test server)
app.get('/users/:userId/decks', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Deck Editor route with explicit /edit suffix used by some tests
app.get('/users/:userId/decks/:deckId/edit', (req, res) => {
  const { userId, deckId } = req.params;
  console.log(`🔍 DEBUG: Deck editor edit route accessed - userId: ${userId}, deckId: ${deckId}`);
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`
  });
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Deck editor route for HTML tests
app.get('/users/:userId/decks/:deckId', (req: any, res) => {
  const { userId, deckId } = req.params;
  console.log(`🔍 DEBUG: Deck editor route accessed - userId: ${userId}, deckId: ${deckId}`);
  
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

// Add deck-editor route for integration tests
app.get('/deck-editor/:deckId', (req, res) => {
  const { deckId } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Deck Editor</title>
    </head>
    <body>
        <h1>Deck Editor</h1>
        <p>Deck ID: ${deckId}</p>
        <div id="deckEditorModal" style="display: block;">
            <div class="deck-editor-content">
                <h3 id="deckEditorTitle" class="editable-title">Test Deck</h3>
                <p id="deckEditorDescription" class="deck-description editable-description">Test Description</p>
                <div id="deckCardsEditor">
                    <div class="deck-card-editor" data-card-id="char-1">
                        <div class="deck-card-editor-reserve">
                            <button class="reserve-btn">Select Reserve</button>
                        </div>
                    </div>
                    <div class="deck-card-editor" data-card-id="char-2">
                        <div class="deck-card-editor-reserve">
                            <button class="reserve-btn">Select Reserve</button>
                        </div>
                    </div>
                    <div class="deck-card-editor" data-card-id="char-3">
                        <div class="deck-card-editor-reserve">
                            <button class="reserve-btn">Select Reserve</button>
                        </div>
                    </div>
                    <div class="deck-card-editor" data-card-id="char-4">
                        <div class="deck-card-editor-reserve">
                            <button class="reserve-btn">Select Reserve</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Test endpoint
app.get('/test', async (req, res) => {
  const characters = await cardRepository.getAllCharacters();
  const locations = await cardRepository.getAllLocations();
  const cardStats = await cardRepository.getCardStats();
  
  res.json({
    characters: characters.length,
    locations: locations.length,
    stats: cardStats,
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});
