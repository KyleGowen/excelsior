import { Character, Location, SpecialCard, Mission, Event, Aspect, AdvancedUniverse, Teamwork, AllyUniverse, TrainingCard, BasicUniverse, PowerCard } from '../types';

export interface CardRepository {
  // Initialization
  initialize(): Promise<void>;

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
  getCardStats(): {
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
  };
}
