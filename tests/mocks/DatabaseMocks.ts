import { mock } from 'jest-mock-extended';
import { UserRepository } from '../../src/repository/UserRepository';
import { DeckRepository } from '../../src/repository/DeckRepository';
import { CardRepository } from '../../src/repository/CardRepository';
import { User, UserRole, Deck, Character, SpecialCard, PowerCard, Location, Mission, Event, Aspect, AdvancedUniverse, Teamwork, AllyUniverse, TrainingCard, BasicUniverse, DeckCard, UIPreferences } from '../../src/types';

// Mock data
const mockUsers: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'guest',
    email: 'guest@example.com',
    role: 'GUEST' as UserRole
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'kyle',
    email: 'kyle@example.com',
    role: 'ADMIN' as UserRole
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'testuser',
    email: 'test@example.com',
    role: 'USER' as UserRole
  }
];

const mockDecks: Deck[] = [
  {
    id: 'deck-1',
    user_id: '00000000-0000-0000-0000-000000000002',
    name: 'Test Deck',
    description: 'A test deck',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'deck-2',
    user_id: '00000000-0000-0000-0000-000000000002',
    name: 'Test Editable Deck',
    description: 'An editable test deck',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockCharacters: Character[] = [
  {
    id: 'char-1',
    name: 'Zeus',
    image: '/images/zeus.jpg',
    alternateImages: ['/images/zeus_alt1.jpg'],
    threat_level: 5,
    energy: 4,
    combat: 3,
    brute_force: 2,
    intelligence: 4,
    special_abilities: 'Lightning bolt attack'
  },
  {
    id: 'char-2',
    name: 'Leonidas',
    image: '/images/leonidas.jpg',
    alternateImages: [],
    threat_level: 4,
    energy: 3,
    combat: 5,
    brute_force: 4,
    intelligence: 2,
    special_abilities: 'Spartan shield defense'
  }
];

const mockSpecialCards: SpecialCard[] = [
  {
    id: 'special-1',
    name: 'Lightning Strike',
    card_type: 'Special',
    character: 'Zeus',
    card_effect: 'Deal 2 damage',
    image: '/images/lightning_strike.jpg',
    is_cataclysm: false,
    is_assist: false,
    one_per_deck: true,
    alternateImages: []
  },
  {
    id: 'special-2',
    name: 'Spartan Charge',
    card_type: 'Special',
    character: 'Leonidas',
    card_effect: 'Deal 3 damage',
    image: '/images/spartan_charge.jpg',
    is_cataclysm: false,
    is_assist: false,
    one_per_deck: false,
    alternateImages: []
  }
];

const mockPowerCards: PowerCard[] = [
  {
    id: 'power-1',
    name: '6 - Energy',
    value: 6,
    power_type: 'Energy',
    image: '/images/energy_6.jpg',
    one_per_deck: false,
    alternateImages: []
  },
  {
    id: 'power-2',
    name: '7 - Combat',
    value: 7,
    power_type: 'Combat',
    image: '/images/combat_7.jpg',
    one_per_deck: true,
    alternateImages: []
  }
];

const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Mount Olympus',
    threat_level: 5,
    special_ability: 'Divine power',
    image: '/images/mount_olympus.jpg'
  },
  {
    id: 'loc-2',
    name: 'Sparta',
    threat_level: 4,
    special_ability: 'Spartan training',
    image: '/images/sparta.jpg'
  }
];

const mockMissions: Mission[] = [
  {
    id: 'mission-1',
    card_name: 'Defend the Gates',
    mission_set: 'Greek Mythology',
    image: '/images/defend_gates.jpg'
  },
  {
    id: 'mission-2',
    card_name: 'Conquer Troy',
    mission_set: 'Greek Mythology',
    image: '/images/conquer_troy.jpg'
  }
];

const mockEvents: Event[] = [
  {
    id: 'event-1',
    name: 'Olympic Games',
    mission_set: 'Greek Mythology',
    game_effect: 'All characters gain +1 energy',
    flavor_text: 'The ancient games begin',
    image: '/images/olympic_games.jpg',
    one_per_deck: false
  }
];

const mockAspects: Aspect[] = [
  {
    id: 'aspect-1',
    card_name: 'Divine Power',
    card_type: 'Aspect',
    location: 'Mount Olympus',
    card_effect: 'Gain divine abilities',
    image: '/images/divine_power.jpg',
    is_fortification: false,
    is_one_per_deck: true
  }
];

const mockAdvancedUniverse: AdvancedUniverse[] = [
  {
    id: 'advanced-1',
    name: 'Divine Intervention',
    card_type: 'Advanced Universe',
    character: 'Zeus',
    card_effect: 'Intervene in battle',
    image: '/images/divine_intervention.jpg',
    is_one_per_deck: true
  }
];

const mockTeamwork: Teamwork[] = [
  {
    id: 'teamwork-1',
    name: 'Energy Teamwork',
    card_type: 'Teamwork',
    to_use: '6 Energy',
    acts_as: 'Combat',
    followup_attack_types: 'Combat',
    first_attack_bonus: '2',
    second_attack_bonus: '1',
    image: '/images/teamwork_energy.jpg',
    one_per_deck: false
  }
];

const mockAllyUniverse: AllyUniverse[] = [
  {
    id: 'ally-1',
    card_name: 'Athena\'s Wisdom',
    card_type: 'Ally Universe',
    stat_to_use: '4 or less',
    stat_type_to_use: 'Intelligence',
    attack_value: '3',
    attack_type: 'Combat',
    card_text: 'Gain wisdom from Athena',
    image: '/images/athena_wisdom.jpg',
    one_per_deck: false
  }
];

const mockTrainingCards: TrainingCard[] = [
  {
    id: 'training-1',
    card_name: 'Combat Training',
    type_1: 'Combat',
    type_2: 'Combat',
    value_to_use: '5 or less',
    bonus: '+2',
    image: '/images/combat_training.jpg',
    one_per_deck: false
  }
];

const mockBasicUniverse: BasicUniverse[] = [
  {
    id: 'basic-1',
    card_name: 'Basic Energy',
    type: 'Energy',
    value_to_use: '6 or greater',
    bonus: '+2',
    image: '/images/basic_energy.jpg',
    one_per_deck: false
  }
];

const mockDeckCards: DeckCard[] = [
  {
    id: 'deckcard-1',
    type: 'character',
    cardId: 'char-1',
    quantity: 1
  },
  {
    id: 'deckcard-2',
    type: 'special',
    cardId: 'special-1',
    quantity: 1
  }
];

// Create mocked repositories
export const mockUserRepository = mock<UserRepository>();
export const mockDeckRepository = mock<DeckRepository>();
export const mockCardRepository = mock<CardRepository>();

// Setup UserRepository mocks
mockUserRepository.initialize.mockResolvedValue();
mockUserRepository.createUser.mockImplementation(async (name: string, email: string, password: string, role: UserRole = 'USER') => {
  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    role
  };
  return newUser;
});
mockUserRepository.getUserById.mockImplementation(async (id: string) => {
  return mockUsers.find(user => user.id === id);
});
mockUserRepository.getUserByUsername.mockImplementation(async (username: string) => {
  return mockUsers.find(user => user.name === username);
});
mockUserRepository.authenticateUser.mockImplementation(async (username: string, password: string) => {
  // Mock authentication logic
  if (username === 'kyle' && password === 'test') {
    return mockUsers.find(user => user.name === 'kyle');
  }
  if (username === 'guest' && password === 'GuestAccess2025!') {
    return mockUsers.find(user => user.name === 'guest');
  }
  if (username === 'testuser' && password === 'password') {
    return mockUsers.find(user => user.name === 'testuser');
  }
  return undefined;
});
mockUserRepository.getAllUsers.mockResolvedValue(mockUsers);
mockUserRepository.updateUser.mockImplementation(async (id: string, updates: Partial<User>) => {
  const user = mockUsers.find(u => u.id === id);
  if (user) {
    Object.assign(user, updates);
    return user;
  }
  return undefined;
});
mockUserRepository.deleteUser.mockResolvedValue(true);
mockUserRepository.getUserStats.mockResolvedValue({ users: mockUsers.length });

// Setup DeckRepository mocks
mockDeckRepository.initialize.mockResolvedValue();
mockDeckRepository.createDeck.mockImplementation(async (userId: string, name: string, description?: string) => {
  const newDeck: Deck = {
    id: `deck-${Date.now()}`,
    user_id: userId,
    name,
    description: description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return newDeck;
});
mockDeckRepository.getDeckById.mockImplementation(async (id: string) => {
  return mockDecks.find(deck => deck.id === id);
});
mockDeckRepository.getDecksByUserId.mockImplementation(async (userId: string) => {
  return mockDecks.filter(deck => deck.user_id === userId);
});
mockDeckRepository.getAllDecks.mockResolvedValue(mockDecks);
mockDeckRepository.updateDeck.mockImplementation(async (id: string, updates: Partial<Deck>) => {
  const deck = mockDecks.find(d => d.id === id);
  if (deck) {
    Object.assign(deck, updates);
    return deck;
  }
  return undefined;
});
mockDeckRepository.deleteDeck.mockResolvedValue(true);
mockDeckRepository.updateUIPreferences.mockResolvedValue(true);
mockDeckRepository.getUIPreferences.mockResolvedValue({});
mockDeckRepository.getDeckStats.mockResolvedValue({ decks: mockDecks.length });
mockDeckRepository.addCardToDeck.mockResolvedValue(true);
mockDeckRepository.removeCardFromDeck.mockResolvedValue(true);
mockDeckRepository.updateCardInDeck.mockResolvedValue(true);
mockDeckRepository.removeAllCardsFromDeck.mockResolvedValue(true);
mockDeckRepository.getDeckCards.mockImplementation(async (deckId: string) => {
  return mockDeckCards.filter(card => card.type === 'character' || card.type === 'special'); // Simplified for testing
});
mockDeckRepository.userOwnsDeck.mockImplementation(async (deckId: string, userId: string) => {
  const deck = mockDecks.find(d => d.id === deckId);
  return deck ? deck.user_id === userId : false;
});

// Setup CardRepository mocks
mockCardRepository.initialize.mockResolvedValue();
mockCardRepository.getCharacterById.mockImplementation(async (id: string) => {
  return mockCharacters.find(char => char.id === id);
});
mockCardRepository.getAllCharacters.mockResolvedValue(mockCharacters);
mockCardRepository.getSpecialCardById.mockImplementation(async (id: string) => {
  return mockSpecialCards.find(card => card.id === id);
});
mockCardRepository.getAllSpecialCards.mockResolvedValue(mockSpecialCards);
mockCardRepository.getPowerCardById.mockImplementation(async (id: string) => {
  return mockPowerCards.find(card => card.id === id);
});
mockCardRepository.getAllPowerCards.mockResolvedValue(mockPowerCards);
mockCardRepository.getLocationById.mockImplementation(async (id: string) => {
  return mockLocations.find(loc => loc.id === id);
});
mockCardRepository.getAllLocations.mockResolvedValue(mockLocations);
mockCardRepository.getMissionById.mockImplementation(async (id: string) => {
  return mockMissions.find(mission => mission.id === id);
});
mockCardRepository.getAllMissions.mockResolvedValue(mockMissions);
mockCardRepository.getEventById.mockImplementation(async (id: string) => {
  return mockEvents.find(event => event.id === id);
});
mockCardRepository.getAllEvents.mockResolvedValue(mockEvents);
mockCardRepository.getAspectById.mockImplementation(async (id: string) => {
  return mockAspects.find(aspect => aspect.id === id);
});
mockCardRepository.getAllAspects.mockResolvedValue(mockAspects);
mockCardRepository.getAdvancedUniverseById.mockImplementation(async (id: string) => {
  return mockAdvancedUniverse.find(card => card.id === id);
});
mockCardRepository.getAllAdvancedUniverse.mockResolvedValue(mockAdvancedUniverse);
mockCardRepository.getTeamworkById.mockImplementation(async (id: string) => {
  return mockTeamwork.find(card => card.id === id);
});
mockCardRepository.getAllTeamwork.mockResolvedValue(mockTeamwork);
mockCardRepository.getAllAllyUniverse.mockResolvedValue(mockAllyUniverse);
mockCardRepository.getAllTraining.mockResolvedValue(mockTrainingCards);
mockCardRepository.getAllBasicUniverse.mockResolvedValue(mockBasicUniverse);
mockCardRepository.getCharacterEffectiveImage.mockImplementation(async (characterId: string, selectedAlternateImage?: string) => {
  const character = mockCharacters.find(c => c.id === characterId);
  if (!character) return '';
  return selectedAlternateImage || character.image;
});
mockCardRepository.getSpecialCardEffectiveImage.mockImplementation(async (specialCardId: string, selectedAlternateImage?: string) => {
  const card = mockSpecialCards.find(c => c.id === specialCardId);
  if (!card) return '';
  return selectedAlternateImage || card.image;
});
mockCardRepository.getPowerCardEffectiveImage.mockImplementation(async (powerCardId: string, selectedAlternateImage?: string) => {
  const card = mockPowerCards.find(c => c.id === powerCardId);
  if (!card) return '';
  return selectedAlternateImage || card.image;
});

// Export mock data for use in tests
export {
  mockUsers,
  mockDecks,
  mockCharacters,
  mockSpecialCards,
  mockPowerCards,
  mockLocations,
  mockMissions,
  mockEvents,
  mockAspects,
  mockAdvancedUniverse,
  mockTeamwork,
  mockAllyUniverse,
  mockTrainingCards,
  mockBasicUniverse,
  mockDeckCards
};
