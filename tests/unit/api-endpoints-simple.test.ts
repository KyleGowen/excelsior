import request from 'supertest';
import express from 'express';

// Create a test app that mimics the main server structure
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock repositories
  const mockUserRepository = {
    getAllUsers: jest.fn(),
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
    updateUserPassword: jest.fn(),
    getUserById: jest.fn()
  };

  const mockDeckRepository = {
    getDecksByUserId: jest.fn(),
    getDeckById: jest.fn(),
    getDeckSummaryWithAllCards: jest.fn(),
    updateDeck: jest.fn(),
    deleteDeck: jest.fn(),
    userOwnsDeck: jest.fn(),
    addCardToDeck: jest.fn(),
    removeCardFromDeck: jest.fn(),
    removeAllCardsFromDeck: jest.fn(),
    getUIPreferences: jest.fn(),
    updateUIPreferences: jest.fn()
  };

  const mockCardRepository = {
    getAllCharacters: jest.fn(),
    getCharacterById: jest.fn(),
    getAllLocations: jest.fn(),
    getAllSpecialCards: jest.fn(),
    getSpecialCardById: jest.fn(),
    getAllMissions: jest.fn(),
    getAllEvents: jest.fn(),
    getAllAspects: jest.fn(),
    getAllAdvancedUniverse: jest.fn(),
    getAllTeamwork: jest.fn(),
    getAllAllyUniverse: jest.fn(),
    getAllTraining: jest.fn(),
    getAllBasicUniverse: jest.fn(),
    getAllPowerCards: jest.fn(),
    getPowerCardById: jest.fn(),
    getCardStats: jest.fn()
  };

  // Mock authentication middleware
  const authenticateUser = (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      username: 'testuser',
      role: 'USER'
    };
    next();
  };

  // Mock admin authentication middleware
  const authenticateAdmin = (req: any, res: any, next: any) => {
    req.user = {
      id: 'admin-user-id',
      username: 'admin',
      role: 'ADMIN'
    };
    next();
  };

  // Card data endpoints
  app.get('/api/characters', async (req, res) => {
    try {
      const characters = await mockCardRepository.getAllCharacters();
      res.json({ success: true, data: characters });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch characters' });
    }
  });

  app.get('/api/characters/:id/alternate-images', async (req, res) => {
    try {
      const character = await mockCardRepository.getCharacterById(req.params.id);
      if (!character) {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }
      res.json({ success: true, data: character.alternateImages || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch alternate images' });
    }
  });

  app.get('/api/locations', async (req, res) => {
    try {
      const locations = await mockCardRepository.getAllLocations();
      res.json({ success: true, data: locations });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch locations' });
    }
  });

  app.get('/api/special-cards', async (req, res) => {
    try {
      const specialCards = await mockCardRepository.getAllSpecialCards();
      res.json({ success: true, data: specialCards });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch special cards' });
    }
  });

  app.get('/api/missions', async (req, res) => {
    try {
      const missions = await mockCardRepository.getAllMissions();
      res.json({ success: true, data: missions });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch missions' });
    }
  });

  app.get('/api/events', async (req, res) => {
    try {
      const events = await mockCardRepository.getAllEvents();
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch events' });
    }
  });

  app.get('/api/aspects', async (req, res) => {
    try {
      const aspects = await mockCardRepository.getAllAspects();
      res.json({ success: true, data: aspects });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch aspects' });
    }
  });

  app.get('/api/advanced-universe', async (req, res) => {
    try {
      const advancedUniverse = await mockCardRepository.getAllAdvancedUniverse();
      res.json({ success: true, data: advancedUniverse });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch advanced universe' });
    }
  });

  app.get('/api/teamwork', async (req, res) => {
    try {
      const teamwork = await mockCardRepository.getAllTeamwork();
      res.json({ success: true, data: teamwork });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch teamwork' });
    }
  });

  app.get('/api/ally-universe', async (req, res) => {
    try {
      const ally = await mockCardRepository.getAllAllyUniverse();
      res.json({ success: true, data: ally });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch ally universe' });
    }
  });

  app.get('/api/training', async (req, res) => {
    try {
      const training = await mockCardRepository.getAllTraining();
      res.json({ success: true, data: training });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch training cards' });
    }
  });

  app.get('/api/basic-universe', async (req, res) => {
    try {
      const basicUniverse = await mockCardRepository.getAllBasicUniverse();
      res.json({ success: true, data: basicUniverse });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch basic universe cards' });
    }
  });

  app.get('/api/power-cards', async (req, res) => {
    try {
      const powerCards = await mockCardRepository.getAllPowerCards();
      res.json({ success: true, data: powerCards });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch power cards' });
    }
  });

  // User management endpoints
  app.get('/api/users', async (req, res) => {
    try {
      const users = await mockUserRepository.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', authenticateAdmin, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Only ADMIN users can create new users' });
      }

      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const existingUser = await mockUserRepository.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ success: false, error: 'Username already exists' });
      }

      const newUser = await mockUserRepository.createUser(username, `${username}@example.com`, password, 'USER');
      const { password_hash, ...userWithoutPassword } = newUser as any;
      
      res.status(201).json({ 
        success: true, 
        data: userWithoutPassword,
        message: `User "${username}" created successfully`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  });

  // Deck management endpoints
  app.get('/api/decks', authenticateUser, async (req: any, res) => {
    try {
      const decks = await mockDeckRepository.getDecksByUserId(req.user.id);
      const transformedDecks = decks.map((deck: any) => ({
        metadata: {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          created: deck.created_at,
          lastModified: deck.updated_at,
          cardCount: deck.card_count || 0,
          threat: deck.threat || 0,
          is_valid: deck.is_valid || false,
          userId: deck.user_id,
          uiPreferences: deck.ui_preferences,
          is_limited: deck.is_limited
        },
        cards: deck.cards || []
      }));
      res.json({ success: true, data: transformedDecks });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch decks' });
    }
  });

  app.get('/api/decks/:id', authenticateUser, async (req: any, res) => {
    try {
      const deck = await mockDeckRepository.getDeckById(req.params.id);
      if (!deck) {
        return res.status(404).json({ success: false, error: 'Deck not found' });
      }
      
      const isOwner = deck.user_id === req.user.id;
      const deckData = { ...deck, isOwner };
      
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
      res.status(500).json({ success: false, error: 'Failed to fetch deck' });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL with Flyway migrations'
    });
  });

  return { app, mockUserRepository, mockDeckRepository, mockCardRepository };
};

describe('API Endpoints - Simplified', () => {
  let app: express.Application;
  let mockUserRepository: any;
  let mockDeckRepository: any;
  let mockCardRepository: any;

  beforeEach(() => {
    const testApp = createTestApp();
    app = testApp.app;
    mockUserRepository = testApp.mockUserRepository;
    mockDeckRepository = testApp.mockDeckRepository;
    mockCardRepository = testApp.mockCardRepository;
  });

  describe('Card Data Endpoints', () => {
    describe('GET /api/characters', () => {
      it('should return all characters successfully', async () => {
        const mockCharacters = [
          { id: '1', name: 'Character 1', threat_level: 10 },
          { id: '2', name: 'Character 2', threat_level: 15 }
        ];
        mockCardRepository.getAllCharacters.mockResolvedValue(mockCharacters);

        const response = await request(app)
          .get('/api/characters')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockCharacters
        });
        expect(mockCardRepository.getAllCharacters).toHaveBeenCalled();
      });

      it('should handle database errors when fetching characters', async () => {
        mockCardRepository.getAllCharacters.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/characters')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Failed to fetch characters'
        });
      });
    });

    describe('GET /api/characters/:id/alternate-images', () => {
      it('should return alternate images for existing character', async () => {
        const mockCharacter = {
          id: '1',
          name: 'Character 1',
          alternateImages: ['image1.webp', 'image2.webp']
        };
        mockCardRepository.getCharacterById.mockResolvedValue(mockCharacter);

        const response = await request(app)
          .get('/api/characters/1/alternate-images')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: ['image1.webp', 'image2.webp']
        });
        expect(mockCardRepository.getCharacterById).toHaveBeenCalledWith('1');
      });

      it('should return 404 for non-existent character', async () => {
        mockCardRepository.getCharacterById.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/characters/999/alternate-images')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'Character not found'
        });
      });

      it('should return empty array when character has no alternate images', async () => {
        const mockCharacter = {
          id: '1',
          name: 'Character 1',
          alternateImages: null
        };
        mockCardRepository.getCharacterById.mockResolvedValue(mockCharacter);

        const response = await request(app)
          .get('/api/characters/1/alternate-images')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: []
        });
      });
    });

    describe('GET /api/locations', () => {
      it('should return all locations successfully', async () => {
        const mockLocations = [
          { id: '1', name: 'Location 1', threat_level: 5 },
          { id: '2', name: 'Location 2', threat_level: 8 }
        ];
        mockCardRepository.getAllLocations.mockResolvedValue(mockLocations);

        const response = await request(app)
          .get('/api/locations')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockLocations
        });
        expect(mockCardRepository.getAllLocations).toHaveBeenCalled();
      });

      it('should handle database errors when fetching locations', async () => {
        mockCardRepository.getAllLocations.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/locations')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Failed to fetch locations'
        });
      });
    });

    describe('GET /api/special-cards', () => {
      it('should return all special cards successfully', async () => {
        const mockSpecialCards = [
          { id: '1', name: 'Special Card 1' },
          { id: '2', name: 'Special Card 2' }
        ];
        mockCardRepository.getAllSpecialCards.mockResolvedValue(mockSpecialCards);

        const response = await request(app)
          .get('/api/special-cards')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockSpecialCards
        });
        expect(mockCardRepository.getAllSpecialCards).toHaveBeenCalled();
      });
    });

    describe('GET /api/missions', () => {
      it('should return all missions successfully', async () => {
        const mockMissions = [
          { id: '1', name: 'Mission 1' },
          { id: '2', name: 'Mission 2' }
        ];
        mockCardRepository.getAllMissions.mockResolvedValue(mockMissions);

        const response = await request(app)
          .get('/api/missions')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockMissions
        });
        expect(mockCardRepository.getAllMissions).toHaveBeenCalled();
      });
    });

    describe('GET /api/events', () => {
      it('should return all events successfully', async () => {
        const mockEvents = [
          { id: '1', name: 'Event 1' },
          { id: '2', name: 'Event 2' }
        ];
        mockCardRepository.getAllEvents.mockResolvedValue(mockEvents);

        const response = await request(app)
          .get('/api/events')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockEvents
        });
        expect(mockCardRepository.getAllEvents).toHaveBeenCalled();
      });
    });

    describe('GET /api/aspects', () => {
      it('should return all aspects successfully', async () => {
        const mockAspects = [
          { id: '1', name: 'Aspect 1' },
          { id: '2', name: 'Aspect 2' }
        ];
        mockCardRepository.getAllAspects.mockResolvedValue(mockAspects);

        const response = await request(app)
          .get('/api/aspects')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockAspects
        });
        expect(mockCardRepository.getAllAspects).toHaveBeenCalled();
      });
    });

    describe('GET /api/advanced-universe', () => {
      it('should return all advanced universe cards successfully', async () => {
        const mockAdvancedUniverse = [
          { id: '1', name: 'Advanced Card 1' },
          { id: '2', name: 'Advanced Card 2' }
        ];
        mockCardRepository.getAllAdvancedUniverse.mockResolvedValue(mockAdvancedUniverse);

        const response = await request(app)
          .get('/api/advanced-universe')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockAdvancedUniverse
        });
        expect(mockCardRepository.getAllAdvancedUniverse).toHaveBeenCalled();
      });
    });

    describe('GET /api/teamwork', () => {
      it('should return all teamwork cards successfully', async () => {
        const mockTeamwork = [
          { id: '1', name: 'Teamwork Card 1' },
          { id: '2', name: 'Teamwork Card 2' }
        ];
        mockCardRepository.getAllTeamwork.mockResolvedValue(mockTeamwork);

        const response = await request(app)
          .get('/api/teamwork')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockTeamwork
        });
        expect(mockCardRepository.getAllTeamwork).toHaveBeenCalled();
      });
    });

    describe('GET /api/ally-universe', () => {
      it('should return all ally universe cards successfully', async () => {
        const mockAllyUniverse = [
          { id: '1', name: 'Ally Card 1' },
          { id: '2', name: 'Ally Card 2' }
        ];
        mockCardRepository.getAllAllyUniverse.mockResolvedValue(mockAllyUniverse);

        const response = await request(app)
          .get('/api/ally-universe')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockAllyUniverse
        });
        expect(mockCardRepository.getAllAllyUniverse).toHaveBeenCalled();
      });
    });

    describe('GET /api/training', () => {
      it('should return all training cards successfully', async () => {
        const mockTraining = [
          { id: '1', name: 'Training Card 1' },
          { id: '2', name: 'Training Card 2' }
        ];
        mockCardRepository.getAllTraining.mockResolvedValue(mockTraining);

        const response = await request(app)
          .get('/api/training')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockTraining
        });
        expect(mockCardRepository.getAllTraining).toHaveBeenCalled();
      });
    });

    describe('GET /api/basic-universe', () => {
      it('should return all basic universe cards successfully', async () => {
        const mockBasicUniverse = [
          { id: '1', name: 'Basic Card 1' },
          { id: '2', name: 'Basic Card 2' }
        ];
        mockCardRepository.getAllBasicUniverse.mockResolvedValue(mockBasicUniverse);

        const response = await request(app)
          .get('/api/basic-universe')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockBasicUniverse
        });
        expect(mockCardRepository.getAllBasicUniverse).toHaveBeenCalled();
      });
    });

    describe('GET /api/power-cards', () => {
      it('should return all power cards successfully', async () => {
        const mockPowerCards = [
          { id: '1', name: 'Power Card 1' },
          { id: '2', name: 'Power Card 2' }
        ];
        mockCardRepository.getAllPowerCards.mockResolvedValue(mockPowerCards);

        const response = await request(app)
          .get('/api/power-cards')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockPowerCards
        });
        expect(mockCardRepository.getAllPowerCards).toHaveBeenCalled();
      });
    });
  });

  describe('User Management Endpoints', () => {
    describe('GET /api/users', () => {
      it('should return all users successfully', async () => {
        const mockUsers = [
          { id: '1', username: 'user1', role: 'USER' },
          { id: '2', username: 'user2', role: 'ADMIN' }
        ];
        mockUserRepository.getAllUsers.mockResolvedValue(mockUsers);

        const response = await request(app)
          .get('/api/users')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockUsers
        });
        expect(mockUserRepository.getAllUsers).toHaveBeenCalled();
      });

      it('should handle database errors when fetching users', async () => {
        mockUserRepository.getAllUsers.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/users')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Failed to fetch users'
        });
      });
    });

    describe('POST /api/users', () => {
      it('should create user successfully when admin', async () => {
        const newUser = {
          id: 'new-user-id',
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'USER',
          password_hash: 'hashed_password'
        };
        mockUserRepository.getUserByUsername.mockResolvedValue(null);
        mockUserRepository.createUser.mockResolvedValue(newUser);

        const response = await request(app)
          .post('/api/users')
          .send({ username: 'newuser', password: 'password123' })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: {
            id: 'new-user-id',
            username: 'newuser',
            email: 'newuser@example.com',
            role: 'USER'
          },
          message: 'User "newuser" created successfully'
        });
        expect(mockUserRepository.createUser).toHaveBeenCalledWith(
          'newuser',
          'newuser@example.com',
          'password123',
          'USER'
        );
      });

      it('should return 400 when username is missing', async () => {
        const response = await request(app)
          .post('/api/users')
          .send({ password: 'password123' })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Username and password are required'
        });
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/api/users')
          .send({ username: 'newuser' })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Username and password are required'
        });
      });

      it('should return 409 when username already exists', async () => {
        mockUserRepository.getUserByUsername.mockResolvedValue({
          id: 'existing-user-id',
          username: 'existinguser'
        });

        const response = await request(app)
          .post('/api/users')
          .send({ username: 'existinguser', password: 'password123' })
          .expect(409);

        expect(response.body).toEqual({
          success: false,
          error: 'Username already exists'
        });
      });
    });
  });

  describe('Deck Management Endpoints', () => {
    describe('GET /api/decks', () => {
      it('should return user decks successfully', async () => {
        const mockDecks = [
          {
            id: 'deck-1',
            name: 'Test Deck 1',
            description: 'Test Description 1',
            created_at: '2023-01-01',
            updated_at: '2023-01-02',
            card_count: 10,
            threat: 25,
            is_valid: true,
            user_id: 'test-user-id',
            ui_preferences: { viewMode: 'tile' },
            is_limited: false,
            cards: []
          }
        ];
        mockDeckRepository.getDecksByUserId.mockResolvedValue(mockDecks);

        const response = await request(app)
          .get('/api/decks')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: [
            {
              metadata: {
                id: 'deck-1',
                name: 'Test Deck 1',
                description: 'Test Description 1',
                created: '2023-01-01',
                lastModified: '2023-01-02',
                cardCount: 10,
                threat: 25,
                is_valid: true,
                userId: 'test-user-id',
                uiPreferences: { viewMode: 'tile' },
                is_limited: false
              },
              cards: []
            }
          ]
        });
        expect(mockDeckRepository.getDecksByUserId).toHaveBeenCalledWith('test-user-id');
      });

      it('should handle database errors when fetching decks', async () => {
        mockDeckRepository.getDecksByUserId.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/decks')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Failed to fetch decks'
        });
      });
    });

    describe('GET /api/decks/:id', () => {
      it('should return deck successfully when user owns it', async () => {
        const mockDeck = {
          id: 'deck-1',
          name: 'Test Deck',
          description: 'Test Description',
          created_at: '2023-01-01',
          updated_at: '2023-01-02',
          user_id: 'test-user-id',
          ui_preferences: { viewMode: 'tile' },
          is_limited: false,
          reserve_character: 'char1',
          cards: []
        };
        mockDeckRepository.getDeckById.mockResolvedValue(mockDeck);

        const response = await request(app)
          .get('/api/decks/deck-1')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            metadata: {
              id: 'deck-1',
              name: 'Test Deck',
              description: 'Test Description',
              created: '2023-01-01',
              lastModified: '2023-01-02',
              cardCount: 0,
              userId: 'test-user-id',
              uiPreferences: { viewMode: 'tile' },
              isOwner: true,
              is_limited: false,
              reserve_character: 'char1'
            },
            cards: []
          }
        });
        expect(mockDeckRepository.getDeckById).toHaveBeenCalledWith('deck-1');
      });

      it('should return 404 when deck not found', async () => {
        mockDeckRepository.getDeckById.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/decks/nonexistent')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'Deck not found'
        });
      });

      it('should handle database errors when fetching deck', async () => {
        mockDeckRepository.getDeckById.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/decks/deck-1')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Failed to fetch deck'
        });
      });
    });
  });

  describe('Health Endpoint', () => {
    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body).toEqual({
          status: 'OK',
          timestamp: expect.any(String),
          database: 'PostgreSQL with Flyway migrations'
        });
        expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      });
    });
  });
});
