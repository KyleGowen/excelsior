import { Character, Location, SpecialCard, Mission, Event, Aspect, AdvancedUniverse, Teamwork, AllyUniverse, TrainingCard, BasicUniverse, PowerCard } from '../types';

export interface CardRepository {
  // Initialization
  initialize(): Promise<void>;

  // Character management
  getCharacterById(id: string): Promise<Character | undefined>;
  getAllCharacters(): Promise<Character[]>;

  // Special card management
  getSpecialCardById(id: string): Promise<SpecialCard | undefined>;
  getAllSpecialCards(): Promise<SpecialCard[]>;

  // Power card management
  getPowerCardById(id: string): Promise<PowerCard | undefined>;
  getAllPowerCards(): Promise<PowerCard[]>;

  // Location management
  getLocationById(id: string): Promise<Location | undefined>;
  getAllLocations(): Promise<Location[]>;

  // Mission management
  getMissionById(id: string): Promise<Mission | undefined>;
  getAllMissions(): Promise<Mission[]>;

  // Event management
  getEventById(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;

  // Aspect management
  getAspectById(id: string): Promise<Aspect | undefined>;
  getAllAspects(): Promise<Aspect[]>;

  // Advanced Universe management
  getAdvancedUniverseById(id: string): Promise<AdvancedUniverse | undefined>;
  getAllAdvancedUniverse(): Promise<AdvancedUniverse[]>;

  // Teamwork management
  getTeamworkById(id: string): Promise<Teamwork | undefined>;
  getAllTeamwork(): Promise<Teamwork[]>;

  // Ally Universe management
  getAllAllyUniverse(): Promise<AllyUniverse[]>;

  // Training management
  getAllTraining(): Promise<TrainingCard[]>;

  // Basic Universe management
  getAllBasicUniverse(): Promise<BasicUniverse[]>;

  // Image management
  getCharacterEffectiveImage(characterId: string, selectedAlternateImage?: string): Promise<string>;
  getSpecialCardEffectiveImage(specialCardId: string, selectedAlternateImage?: string): Promise<string>;
  getPowerCardEffectiveImage(powerCardId: string, selectedAlternateImage?: string): Promise<string>;

  // Statistics
  getCardStats(): Promise<{
    characters: number;
    locations: number;
    specialCards: number;
    missions: number;
    events: number;
    aspects: number;
    advancedUniverse: number;
    teamwork: number;
    allyUniverse: number;
    training: number;
    basicUniverse: number;
    powerCards: number;
  }>;
}
