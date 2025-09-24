import 'dotenv/config';
import express from 'express';
import { DataSourceConfig } from './config/DataSourceConfig';
import { DeckPersistenceService } from './services/deckPersistence';
import { UserPersistenceService } from './persistence/userPersistence';
import { DatabaseInitializationService } from './services/databaseInitialization';
import { Character } from './types';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const deckService = new DeckPersistenceService();
const userService = new UserPersistenceService();
const databaseInit = new DatabaseInitializationService();
const dataSource = DataSourceConfig.getInstance();
const userRepository = dataSource.getUserRepository();
const deckRepository = dataSource.getDeckRepository();
const cardRepository = dataSource.getCardRepository();

// Middleware
app.use(express.json());

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
    
    console.log('🚀 Overpower Deckbuilder server running on port', PORT);
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
const authenticateUser = (req: any, res: any, next: any) => {
  const sessionId = req.cookies?.sessionId;
  const { userId } = req.params;
  
  // Special handling for guest user - allow access without session
  if (userId === 'guest') {
    const guestUser = userService.getUserById('guest-001');
    if (guestUser) {
      req.user = guestUser;
      return next();
    }
  }
  
  if (!sessionId) {
    console.log('Authentication failed: No session found for user', userId, 'at', req.originalUrl);
    // Return JSON error for API calls, redirect for page requests
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    return res.redirect('/');
  }
  
  const session = userService.validateSession(sessionId);
  if (!session) {
    console.log('Authentication failed: Invalid or expired session for user', userId, 'at', req.originalUrl);
    // Return JSON error for API calls, redirect for page requests
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }
    return res.redirect('/');
  }
  
  req.user = session;
  next();
};

// User authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    
    // Use database authentication
    const user = await userRepository.authenticateUser(username, password);
    if (user) {
      const sessionId = userService.createSession({ 
        id: user.id, 
        username: user.name, 
        password: '', 
        createdAt: new Date() 
      });
      
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: false,
        maxAge: 2 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
      
      return res.json({ 
        success: true, 
        data: { 
          userId: user.id, 
          username: user.name 
        } 
      });
    }
    
    res.status(401).json({ success: false, error: 'Invalid username or password' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId;
    
    if (sessionId) {
      userService.logout(sessionId);
    }
    
    res.clearCookie('sessionId');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

app.get('/api/auth/me', authenticateUser, (req: any, res) => {
  try {
    res.json({ 
      success: true, 
      data: { 
        userId: req.user.userId, 
        username: req.user.username 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

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

app.get('/api/users', (req, res) => {
  try {
    const users = userRepository.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

app.get('/api/decks', authenticateUser, async (req: any, res) => {
  try {
    const decks = await deckRepository.getDecksByUserId(req.user.userId);
    
    // Load cards for each deck
    const decksWithCards = await Promise.all(decks.map(async (deck) => {
      const fullDeck = await deckRepository.getDeckById(deck.id);
      return fullDeck || deck;
    }));
    
    // Transform deck data to match frontend expectations
    const transformedDecks = decksWithCards.map(deck => ({
      metadata: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        created: deck.created_at,
        lastModified: deck.updated_at,
        cardCount: deck.cards?.length || 0,
        userId: deck.user_id,
        uiPreferences: deck.ui_preferences
      },
      cards: deck.cards || []
    }));
    
    res.json({ success: true, data: transformedDecks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch decks' });
  }
});

// Deck management API routes
app.post('/api/decks', authenticateUser, async (req: any, res) => {
  try {
    const { name, description, characters } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Deck name is required' });
    }
    
    const deck = await deckRepository.createDeck(req.user.userId, name, description, characters);
    res.json({ success: true, data: deck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create deck' });
  }
});

app.get('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    if (deck.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    // Transform deck data to match frontend expectations
    const transformedDeck = {
      metadata: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        created: deck.created_at,
        lastModified: deck.updated_at,
        cardCount: deck.cards?.length || 0,
        userId: deck.user_id,
        uiPreferences: deck.ui_preferences
      },
      cards: deck.cards || []
    };
    
    res.json({ success: true, data: transformedDeck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deck' });
  }
});

app.put('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if user owns this deck
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck || deck.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const updatedDeck = await deckRepository.updateDeck(req.params.id, { name, description });
    if (!updatedDeck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, data: updatedDeck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update deck' });
  }
});

app.delete('/api/decks/:id', authenticateUser, async (req: any, res) => {
  try {
    // Check if user owns this deck
    const deck = await deckRepository.getDeckById(req.params.id);
    if (!deck || deck.user_id !== req.user.userId) {
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

app.post('/api/decks/:id/cards', authenticateUser, async (req: any, res) => {
  try {
    const { cardType, cardId, quantity, selectedAlternateImage } = req.body;
    if (!cardType || !cardId) {
      return res.status(400).json({ success: false, error: 'Card type and card ID are required' });
    }
    
    // Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(req.params.id, req.user.userId)) {
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

app.delete('/api/decks/:id/cards', authenticateUser, async (req: any, res) => {
  try {
    const { cardType, cardId, quantity } = req.body;
    if (!cardType || !cardId) {
      return res.status(400).json({ success: false, error: 'Card type and card ID are required' });
    }
    
    // Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(req.params.id, req.user.userId)) {
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
    const userDecks = await deckRepository.getDecksByUserId(req.user.userId);
    const totalCards = userDecks.reduce((total, deck) => total + (deck.cards?.length || 0), 0);
    const stats = { totalDecks: userDecks.length, totalCards };
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
    if (!await deckRepository.userOwnsDeck(id, req.user.userId)) {
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
    const { id } = req.params;
    const preferences = req.body;
    
    // Check if user owns this deck
    if (!await deckRepository.userOwnsDeck(id, req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = await deckRepository.updateUIPreferences(id, preferences);
    if (success) {
      res.json({ success: true, data: preferences });
    } else {
      res.status(404).json({ success: false, error: 'Deck not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update UI preferences' });
  }
});

// Main page route - displays characters table
// Main application route - serves the app with login modal
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Deck Builder route (Image 2)
app.get('/users/:userId/decks', authenticateUser, (req: any, res) => {
  const { userId } = req.params;
  
  // Verify user is accessing their own decks
  // Handle both userId (from session) and id (from direct user lookup)
  const userIdentifier = req.user.userId || req.user.id;
  
  // Special case for guest user - allow both 'guest' and 'guest-001' URLs
  const isGuestAccess = (userId === 'guest' && userIdentifier === 'guest-001') || 
                       (userIdentifier === userId);
  
  if (!isGuestAccess) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Deck Editor route - serve deck editor for specific deck
app.get('/users/:userId/decks/:deckId', authenticateUser, (req: any, res) => {
  const { userId, deckId } = req.params;
  
  // Verify user is accessing their own decks
  // Handle both userId (from session) and id (from direct user lookup)
  const userIdentifier = req.user.userId || req.user.id;
  
  // Special case for guest user - allow both 'guest' and 'guest-001' URLs
  const isGuestAccess = (userId === 'guest' && userIdentifier === 'guest-001') || 
                       (userIdentifier === userId);
  
  if (!isGuestAccess) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Database View route (Image 3) - serve original database view
app.get('/data', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Static file serving for non-conflicting paths
app.use('/public', express.static('public'));
app.use(express.static('public'));
app.use('/src/resources', express.static('src/resources'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL with Flyway migrations'
  });
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

// Server startup is now handled in initializeServer() function

