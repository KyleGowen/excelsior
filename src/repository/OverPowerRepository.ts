import { User, Deck, Character, Location, SpecialCard, Mission, Event, Aspect, AdvancedUniverse, Teamwork, AllyUniverse, TrainingCard, BasicUniverse, PowerCard } from '../types';

export interface OverPowerRepository {
  // Initialization
  initialize(): Promise<void>;

  // User management
  createUser(name: string, email: string): User;
  getUserById(id: string): User | undefined;
  getAllUsers(): User[];

  // Deck management
  createDeck(userId: string, name: string): Deck;
  getDeckById(id: string): Deck | undefined;
  getDecksByUserId(userId: string): Deck[];
  getAllDecks(): Deck[];

  // Character management
  getCharacterById(id: string): Character | undefined;
  getAllCharacters(): Character[];

  // Special card management
  getSpecialCardById(id: string): SpecialCard | undefined;
  getAllSpecialCards(): SpecialCard[];

  // Power card management
  getPowerCardById(id: string): PowerCard | undefined;
  getAllPowerCards(): PowerCard[];

  // Location management
  getLocationById(id: string): Location | undefined;
  getAllLocations(): Location[];

  // Mission management
  getMissionById(id: string): Mission | undefined;
  getAllMissions(): Mission[];

  // Event management
  getEventById(id: string): Event | undefined;
  getAllEvents(): Event[];

  // Aspect management
  getAspectById(id: string): Aspect | undefined;
  getAllAspects(): Aspect[];

  // Advanced Universe management
  getAdvancedUniverseById(id: string): AdvancedUniverse | undefined;
  getAllAdvancedUniverse(): AdvancedUniverse[];

  // Teamwork management
  getTeamworkById(id: string): Teamwork | undefined;
  getAllTeamwork(): Teamwork[];

  // Ally Universe management
  getAllAllyUniverse(): AllyUniverse[];

  // Training management
  getAllTraining(): TrainingCard[];

  // Basic Universe management
  getAllBasicUniverse(): BasicUniverse[];

  // Image management
  getCharacterEffectiveImage(characterId: string, selectedAlternateImage?: string): string;
  getSpecialCardEffectiveImage(specialCardId: string, selectedAlternateImage?: string): string;
  getPowerCardEffectiveImage(powerCardId: string, selectedAlternateImage?: string): string;

  // Statistics
  getStats(): {
    users: number;
    decks: number;
    characters: number;
    locations: number;
    specialCards: number;
    missions: number;
    events: number;
    aspects: number;
    advancedUniverse: number;
    teamwork: number;
  };
}
