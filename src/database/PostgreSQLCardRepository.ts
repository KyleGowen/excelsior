import { Pool, PoolClient } from 'pg';
import { 
  Character, 
  SpecialCard, 
  PowerCard, 
  Location, 
  Mission, 
  Event, 
  Aspect, 
  AdvancedUniverse, 
  Teamwork, 
  AllyUniverse, 
  TrainingCard, 
  BasicUniverse 
} from '../types';
import { CardRepository } from '../repository/CardRepository';

export class PostgreSQLCardRepository implements CardRepository {
  private pool: Pool;
  
  // Caching for frequently accessed data
  private charactersCache: Character[] | null = null;
  private locationsCache: Location[] | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Clear caches manually (useful after migrations)
  public clearCaches(): void {
    this.charactersCache = null;
    this.locationsCache = null;
    this.cacheTime = 0;
    console.log('🧹 Card repository caches cleared');
  }

  async initialize(): Promise<void> {
    // PostgreSQL CardRepository doesn't need to load data from files
    // Data is already in the database from migrations
    console.log('✅ PostgreSQL CardRepository initialized');
  }

  // Character methods
  async getCharacterById(id: string): Promise<Character | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM characters WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const char = result.rows[0];
      return {
        id: char.id,
        name: char.name,
        energy: char.energy,
        combat: char.combat,
        brute_force: char.brute_force,
        intelligence: char.intelligence,
        threat_level: char.threat_level,
        special_abilities: char.special_abilities,
        image: char.image_path,
        alternateImages: char.alternate_images || []
      };
    } finally {
      client.release();
    }
  }

  async getAllCharacters(): Promise<Character[]> {
    // Return cached result if still valid
    const now = Date.now();
    if (this.charactersCache && (now - this.cacheTime) < this.CACHE_TTL) {
      return this.charactersCache;
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM characters ORDER BY name');
      
      const characters = result.rows.map(char => ({
        id: char.id,
        name: char.name,
        energy: char.energy,
        combat: char.combat,
        brute_force: char.brute_force,
        intelligence: char.intelligence,
        threat_level: char.threat_level,
        special_abilities: char.special_abilities,
        image: char.image_path,
        alternateImages: char.alternate_images || []
      }));
      
      // Cache the result
      this.charactersCache = characters;
      this.cacheTime = now;
      
      return characters;
    } finally {
      client.release();
    }
  }

  async getCharacterEffectiveImage(characterId: string, selectedAlternateImage?: string): Promise<string> {
    const character = await this.getCharacterById(characterId);
    if (!character) return '';

    if (selectedAlternateImage && character.alternateImages?.includes(selectedAlternateImage)) {
      return `/src/resources/cards/images/characters/alternate/${selectedAlternateImage}`;
    }

    return character.image || '';
  }

  // Special Card methods
  async getSpecialCardById(id: string): Promise<SpecialCard | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM special_cards WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
            return {
              id: card.id,
              name: card.name,
              card_type: card.card_type,
              character: card.character_name,
              card_effect: card.card_effect,
              image: card.image_path,
              icons: card.icons || undefined,
              value: card.value ?? null,
              is_cataclysm: card.cataclysm || false,
              is_assist: card.assist || false,
              is_ambush: card.ambush || false,
              one_per_deck: card.one_per_deck || false,
              alternateImages: card.alternate_images || []
            };
    } finally {
      client.release();
    }
  }

  async getAllSpecialCards(): Promise<SpecialCard[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM special_cards ORDER BY character_name, name');
      
            return result.rows.map(card => ({
              id: card.id,
              name: card.name,
              card_type: card.card_type,
              character: card.character_name,
              card_effect: card.card_effect,
              image: card.image_path,
              icons: card.icons || undefined,
              value: card.value ?? null,
              is_cataclysm: card.cataclysm || false,
              is_assist: card.assist || false,
              is_ambush: card.ambush || false,
              one_per_deck: card.one_per_deck || false,
              alternateImages: card.alternate_images || []
            }));
    } finally {
      client.release();
    }
  }

  async getSpecialCardEffectiveImage(specialCardId: string, selectedAlternateImage?: string): Promise<string> {
    const card = await this.getSpecialCardById(specialCardId);
    if (!card) return '';

    if (selectedAlternateImage && card.alternateImages?.includes(selectedAlternateImage)) {
      return `/src/resources/cards/images/specials/alternate/${selectedAlternateImage}`;
    }

    return card.image || '';
  }

  // Power Card methods
  async getPowerCardById(id: string): Promise<PowerCard | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM power_cards WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
      return {
        id: card.id,
        name: card.name, // Added name field
        power_type: card.power_type,
        value: card.value,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false,
        alternateImages: card.alternate_images || []
      };
    } finally {
      client.release();
    }
  }

  async getAllPowerCards(): Promise<PowerCard[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM power_cards ORDER BY power_type, value');
      
      return result.rows.map(card => ({
        id: card.id,
        name: card.name,
        power_type: card.power_type,
        value: card.value,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false,
        alternateImages: card.alternate_images || []
      }));
    } finally {
      client.release();
    }
  }

  async getPowerCardEffectiveImage(powerCardId: string, selectedAlternateImage?: string): Promise<string> {
    const card = await this.getPowerCardById(powerCardId);
    if (!card) return '';

    if (selectedAlternateImage && card.alternateImages?.includes(selectedAlternateImage)) {
      return `/src/resources/cards/images/power-cards/alternate/${selectedAlternateImage}`;
    }

    return card.image || '';
  }

  // Location methods
  async getLocationById(id: string): Promise<Location | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM locations WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const loc = result.rows[0];
      return {
        id: loc.id,
        name: loc.name,
        threat_level: loc.threat_level,
        special_ability: loc.special_ability,
        image: loc.image_path
      };
    } finally {
      client.release();
    }
  }

  async getAllLocations(): Promise<Location[]> {
    // Return cached result if still valid
    const now = Date.now();
    if (this.locationsCache && (now - this.cacheTime) < this.CACHE_TTL) {
      return this.locationsCache;
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM locations ORDER BY name');
      
      const locations = result.rows.map(loc => ({
        id: loc.id,
        name: loc.name,
        threat_level: loc.threat_level,
        special_ability: loc.special_ability,
        image: loc.image_path
      }));
      
      // Cache the result
      this.locationsCache = locations;
      this.cacheTime = now;
      
      return locations;
    } finally {
      client.release();
    }
  }

  // Mission methods
  async getMissionById(id: string): Promise<Mission | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM missions WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const mission = result.rows[0];
      return {
        id: mission.id,
        mission_set: mission.mission_set,
        card_name: mission.name,
        image: mission.image_path
      };
    } finally {
      client.release();
    }
  }

  async getAllMissions(): Promise<Mission[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM missions ORDER BY universe, name');
      
      return result.rows.map(mission => ({
        id: mission.id,
        mission_set: mission.mission_set,
        card_name: mission.name,
        image: mission.image_path
      }));
    } finally {
      client.release();
    }
  }

  // Event methods
  async getEventById(id: string): Promise<Event | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const event = result.rows[0];
      return {
        id: event.id,
        name: event.name,
        mission_set: event.mission_set,
        game_effect: event.game_effect,
        flavor_text: event.flavor_text,
        image: event.image_path,
        one_per_deck: event.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllEvents(): Promise<Event[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM events ORDER BY universe, name');
      
      return result.rows.map(event => ({
        id: event.id,
        name: event.name,
        mission_set: event.mission_set,
        game_effect: event.game_effect,
        flavor_text: event.flavor_text,
        image: event.image_path,
        one_per_deck: event.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Aspect methods
  async getAspectById(id: string): Promise<Aspect | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM aspects WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const aspect = result.rows[0];
      return {
        id: aspect.id,
        card_name: aspect.name,
        card_type: aspect.card_type,
        location: aspect.location,
        card_effect: aspect.card_effect,
        image: aspect.image_path,
        is_fortification: aspect.fortifications || false,
        is_one_per_deck: aspect.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllAspects(): Promise<Aspect[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM aspects ORDER BY universe, name');
      
      return result.rows.map(aspect => ({
        id: aspect.id,
        card_name: aspect.name,
        card_type: aspect.card_type,
        location: aspect.location,
        card_effect: aspect.card_effect,
        aspect_description: aspect.aspect_description,
        image: aspect.image_path,
        icons: aspect.icons || undefined,
        value: aspect.value ?? null,
        is_fortification: aspect.fortifications || false,
        is_one_per_deck: aspect.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Advanced Universe methods
  async getAdvancedUniverseById(id: string): Promise<AdvancedUniverse | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM advanced_universe_cards WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
      return {
        id: card.id,
        name: card.name,
        card_type: card.card_type,
        character: card.character,
        card_effect: card.card_effect,
        image: card.image_path,
        is_one_per_deck: card.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllAdvancedUniverse(): Promise<AdvancedUniverse[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM advanced_universe_cards ORDER BY universe, name');
      
      return result.rows.map(card => ({
        id: card.id,
        name: card.name,
        card_type: card.card_type,
        character: card.character,
        card_effect: card.card_effect,
        card_description: card.card_description,
        image: card.image_path,
        is_one_per_deck: card.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Teamwork methods
  async getTeamworkById(id: string): Promise<Teamwork | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM teamwork_cards WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
      return {
        id: card.id,
        name: card.name,
        card_type: card.card_type,
        to_use: card.to_use,
        acts_as: card.acts_as,
        followup_attack_types: card.followup_attack_types,
        first_attack_bonus: card.first_attack_bonus,
        second_attack_bonus: card.second_attack_bonus,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllTeamwork(): Promise<Teamwork[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM teamwork_cards ORDER BY universe, name');
      
      return result.rows.map(card => ({
        id: card.id,
        name: card.name,
        card_type: card.card_type,
        to_use: card.to_use,
        acts_as: card.acts_as,
        followup_attack_types: card.followup_attack_types,
        first_attack_bonus: card.first_attack_bonus,
        second_attack_bonus: card.second_attack_bonus,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Ally Universe methods
  async getAllyUniverseById(id: string): Promise<AllyUniverse | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM ally_universe_cards WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
      return {
        id: card.id,
        card_name: card.name,
        card_type: card.card_type,
        stat_to_use: card.stat_to_use,
        stat_type_to_use: card.stat_type_to_use,
        attack_value: card.attack_value,
        attack_type: card.attack_type,
        card_text: card.card_text,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllAllyUniverse(): Promise<AllyUniverse[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM ally_universe_cards ORDER BY universe, name');
      
      return result.rows.map(card => ({
        id: card.id,
        card_name: card.name,
        card_type: card.card_type,
        stat_to_use: card.stat_to_use,
        stat_type_to_use: card.stat_type_to_use,
        attack_value: card.attack_value,
        attack_type: card.attack_type,
        card_text: card.card_text,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Training methods
  async getTrainingById(id: string): Promise<TrainingCard | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, name, type_1, type_2, value_to_use, bonus, image_path, one_per_deck FROM training_cards WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
      return {
        id: card.id,
        card_name: card.name,
        type_1: card.type_1,
        type_2: card.type_2,
        value_to_use: card.value_to_use,
        bonus: card.bonus,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllTraining(): Promise<TrainingCard[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT id, name, type_1, type_2, value_to_use, bonus, image_path, one_per_deck FROM training_cards ORDER BY universe, name');
      
      return result.rows.map(card => ({
        id: card.id,
        card_name: card.name,
        type_1: card.type_1,
        type_2: card.type_2,
        value_to_use: card.value_to_use,
        bonus: card.bonus,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Basic Universe methods
  async getBasicUniverseById(id: string): Promise<BasicUniverse | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM basic_universe_cards WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const card = result.rows[0];
      return {
        id: card.id,
        card_name: card.name,
        type: card.type,
        value_to_use: card.value_to_use,
        bonus: card.bonus,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      };
    } finally {
      client.release();
    }
  }

  async getAllBasicUniverse(): Promise<BasicUniverse[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM basic_universe_cards ORDER BY universe, name');
      
      return result.rows.map(card => ({
        id: card.id,
        card_name: card.name,
        type: card.type,
        value_to_use: card.value_to_use,
        bonus: card.bonus,
        image: card.image_path,
        one_per_deck: card.one_per_deck || false
      }));
    } finally {
      client.release();
    }
  }

  // Card stats method - optimized with caching
  private cardStatsCache: any = null;
  private cardStatsCacheTime: number = 0;
  private readonly CARD_STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getCardStats(): Promise<{
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
  }> {
    // Return cached result if still valid
    const now = Date.now();
    if (this.cardStatsCache && (now - this.cardStatsCacheTime) < this.CARD_STATS_CACHE_TTL) {
      return this.cardStatsCache;
    }

    const client = await this.pool.connect();
    try {
      // Use a more efficient query with UNION ALL instead of subqueries
      const result = await client.query(`
        SELECT 
          'characters' as table_name, COUNT(*) as count FROM characters
        UNION ALL
        SELECT 'locations', COUNT(*) FROM locations
        UNION ALL
        SELECT 'special_cards', COUNT(*) FROM special_cards
        UNION ALL
        SELECT 'missions', COUNT(*) FROM missions
        UNION ALL
        SELECT 'events', COUNT(*) FROM events
        UNION ALL
        SELECT 'aspects', COUNT(*) FROM aspects
        UNION ALL
        SELECT 'advanced_universe_cards', COUNT(*) FROM advanced_universe_cards
        UNION ALL
        SELECT 'teamwork_cards', COUNT(*) FROM teamwork_cards
        UNION ALL
        SELECT 'ally_universe_cards', COUNT(*) FROM ally_universe_cards
        UNION ALL
        SELECT 'training_cards', COUNT(*) FROM training_cards
        UNION ALL
        SELECT 'basic_universe_cards', COUNT(*) FROM basic_universe_cards
        UNION ALL
        SELECT 'power_cards', COUNT(*) FROM power_cards
      `);
      
      // Convert array result to object
      const stats: any = {};
      result.rows.forEach(row => {
        const key = row.table_name.replace(/_/g, '').replace('cards', 'Cards');
        if (key === 'characters') stats.characters = parseInt(row.count);
        else if (key === 'locations') stats.locations = parseInt(row.count);
        else if (key === 'specialcards') stats.specialCards = parseInt(row.count);
        else if (key === 'missions') stats.missions = parseInt(row.count);
        else if (key === 'events') stats.events = parseInt(row.count);
        else if (key === 'aspects') stats.aspects = parseInt(row.count);
        else if (key === 'advanceduniversecards') stats.advancedUniverse = parseInt(row.count);
        else if (key === 'teamworkcards') stats.teamwork = parseInt(row.count);
        else if (key === 'allyuniversecards') stats.allyUniverse = parseInt(row.count);
        else if (key === 'trainingcards') stats.training = parseInt(row.count);
        else if (key === 'basicuniversecards') stats.basicUniverse = parseInt(row.count);
        else if (key === 'powercards') stats.powerCards = parseInt(row.count);
      });
      
      // Cache the result
      this.cardStatsCache = stats;
      this.cardStatsCacheTime = now;
      
      return stats;
    } finally {
      client.release();
    }
  }
}
