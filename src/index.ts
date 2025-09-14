import express from 'express';
import { database } from './database/inMemoryDatabase';
import { DeckPersistenceService } from './services/deckPersistence';
import { UserPersistenceService } from './persistence/userPersistence';
import { Character } from './types';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const deckService = new DeckPersistenceService();
const userService = new UserPersistenceService();

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
database.initialize().then(() => {
  console.log('🚀 Overpower Deckbuilder server running on port', PORT);
  console.log('📖 API documentation available at http://localhost:' + PORT);
  
  const stats = database.getStats();
  console.log('🔍 Database loaded:', stats.characters, 'characters,', stats.locations, 'locations');
});

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
    return res.redirect('/');
  }
  
  const session = userService.validateSession(sessionId);
  if (!session) {
    console.log('Authentication failed: Invalid or expired session for user', userId, 'at', req.originalUrl);
    return res.redirect('/');
  }
  
  req.user = session;
  next();
};

// User authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    
    const user = userService.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
    
    const sessionId = userService.createSession(user);
    
    // Set session cookie (2 hours expiration)
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: 'lax'
    });
    
    res.json({ 
      success: true, 
      data: { 
        userId: user.id, 
        username: user.username 
      } 
    });
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
app.get('/api/characters', (req, res) => {
  try {
    const characters = database.getAllCharacters();
    res.json({ success: true, data: characters });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch characters' });
  }
});

app.get('/api/characters/:id/alternate-images', (req, res) => {
  try {
    const character = database.getCharacterById(req.params.id);
    if (!character) {
      return res.status(404).json({ success: false, error: 'Character not found' });
    }
    
    res.json({ success: true, data: character.alternateImages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
  }
});

app.get('/api/special-cards/:id/alternate-images', (req, res) => {
  try {
    const specialCard = database.getSpecialCardById(req.params.id);
    if (!specialCard) {
      return res.status(404).json({ success: false, error: 'Special card not found' });
    }
    
    res.json({ success: true, data: specialCard.alternateImages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
  }
});

app.get('/api/power-cards/:id/alternate-images', (req, res) => {
  try {
    const powerCard = database.getPowerCardById(req.params.id);
    if (!powerCard) {
      return res.status(404).json({ success: false, error: 'Power card not found' });
    }
    
    res.json({ success: true, data: powerCard.alternateImages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
  }
});

app.get('/api/locations', (req, res) => {
  try {
    const locations = database.getAllLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

app.get('/api/special-cards', (req, res) => {
  try {
    const specialCards = database.getAllSpecialCards();
    res.json({ success: true, data: specialCards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch special cards' });
  }
});

app.get('/api/missions', (req, res) => {
  try {
    const missions = database.getAllMissions();
    res.json({ success: true, data: missions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch missions' });
  }
});

app.get('/api/events', (req, res) => {
  try {
    const events = database.getAllEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

app.get('/api/aspects', (req, res) => {
  try {
    const aspects = database.getAllAspects();
    res.json({ success: true, data: aspects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch aspects' });
  }
});

app.get('/api/advanced-universe', (req, res) => {
  try {
    const advancedUniverse = database.getAllAdvancedUniverse();
    res.json({ success: true, data: advancedUniverse });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch advanced universe' });
  }
});

app.get('/api/teamwork', (req, res) => {
  try {
    const teamwork = database.getAllTeamwork();
    res.json({ success: true, data: teamwork });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teamwork' });
  }
});

app.get('/api/ally-universe', (req, res) => {
  try {
    const ally = database.getAllAllyUniverse();
    res.json({ success: true, data: ally });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch ally universe' });
  }
});

app.get('/api/training', (req, res) => {
  try {
    const training = database.getAllTraining();
    res.json({ success: true, data: training });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch training cards' });
  }
});

app.get('/api/basic-universe', (req, res) => {
  try {
    const basicUniverse = database.getAllBasicUniverse();
    res.json({ success: true, data: basicUniverse });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch basic universe cards' });
  }
});

app.get('/api/power-cards', (req, res) => {
  try {
    const powerCards = database.getAllPowerCards();
    res.json({ success: true, data: powerCards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch power cards' });
  }
});

app.get('/test', (req, res) => {
  const characters = database.getAllCharacters();
  const locations = database.getAllLocations();
  const stats = database.getStats();
  
  res.json({
    characters: characters.length,
    locations: locations.length,
    stats: stats,
    sampleLocation: locations[0]
  });
});

app.get('/api/users', (req, res) => {
  try {
    const users = database.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

app.get('/api/decks', authenticateUser, (req: any, res) => {
  try {
    const decks = deckService.getDecksByUser(req.user.userId);
    res.json({ success: true, data: decks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch decks' });
  }
});

// Deck management API routes
app.post('/api/decks', authenticateUser, (req: any, res) => {
  try {
    const { name, description, characters } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Deck name is required' });
    }
    
    const deck = deckService.createDeck(name, req.user.userId, description, characters);
    res.json({ success: true, data: deck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create deck' });
  }
});

app.get('/api/decks/:id', authenticateUser, (req: any, res) => {
  try {
    const deck = deckService.getDeck(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Check if user owns this deck
    if (!deckService.userOwnsDeck(req.params.id, req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    res.json({ success: true, data: deck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch deck' });
  }
});

app.put('/api/decks/:id', authenticateUser, (req: any, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if user owns this deck
    if (!deckService.userOwnsDeck(req.params.id, req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const deck = deckService.updateDeckMetadata(req.params.id, { name, description });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, data: deck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update deck' });
  }
});

app.delete('/api/decks/:id', authenticateUser, (req: any, res) => {
  try {
    // Check if user owns this deck
    if (!deckService.userOwnsDeck(req.params.id, req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = deckService.deleteDeck(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete deck' });
  }
});

app.post('/api/decks/:id/cards', authenticateUser, (req: any, res) => {
  try {
    const { cardType, cardId, quantity, selectedAlternateImage } = req.body;
    if (!cardType || !cardId) {
      return res.status(400).json({ success: false, error: 'Card type and card ID are required' });
    }
    
    // Check if user owns this deck
    if (!deckService.userOwnsDeck(req.params.id, req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const deck = deckService.addCardToDeck(req.params.id, cardType, cardId, quantity || 1, selectedAlternateImage);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, data: deck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add card to deck' });
  }
});

app.delete('/api/decks/:id/cards', authenticateUser, (req: any, res) => {
  try {
    const { cardType, cardId, quantity } = req.body;
    if (!cardType || !cardId) {
      return res.status(400).json({ success: false, error: 'Card type and card ID are required' });
    }
    
    // Check if user owns this deck
    if (!deckService.userOwnsDeck(req.params.id, req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const deck = deckService.removeCardFromDeck(req.params.id, cardType, cardId, quantity || 1);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, data: deck });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove card from deck' });
  }
});

app.get('/api/deck-stats', authenticateUser, (req: any, res) => {
  try {
    const userDecks = deckService.getDecksByUser(req.user.userId);
    const totalCards = userDecks.reduce((total, deck) => total + deck.cardCount, 0);
    const stats = { totalDecks: userDecks.length, totalCards };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch deck stats' });
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

app.listen(PORT, () => {
  console.log(`🚀 Server starting on port ${PORT}...`);
});

