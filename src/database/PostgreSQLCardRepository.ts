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

  constructor(pool: Pool) {
    this.pool = pool;
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
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM characters ORDER BY name');
      
      return result.rows.map(char => ({
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
        is_cataclysm: card.cataclysm || false,
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
        is_cataclysm: card.cataclysm || false,
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
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM locations ORDER BY name');
      
      return result.rows.map(loc => ({
        id: loc.id,
        name: loc.name,
        threat_level: loc.threat_level,
        special_ability: loc.special_ability,
        image: loc.image_path
      }));
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
        image: event.image_path
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
        image: event.image_path
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
        image: aspect.image_path,
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
        card_type: card.card_type,
        to_use: card.to_use,
        acts_as: card.acts_as,
        followup_attack_types: card.followup_attack_types,
        first_attack_bonus: card.first_attack_bonus,
        second_attack_bonus: card.second_attack_bonus,
        image: card.image_path
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
        card_type: card.card_type,
        to_use: card.to_use,
        acts_as: card.acts_as,
        followup_attack_types: card.followup_attack_types,
        first_attack_bonus: card.first_attack_bonus,
        second_attack_bonus: card.second_attack_bonus,
        image: card.image_path
      }));
    } finally {
      client.release();
    }
  }

  // Ally Universe methods
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
        image: card.image_path
      }));
    } finally {
      client.release();
    }
  }

  // Training methods
  async getAllTraining(): Promise<TrainingCard[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM training_cards ORDER BY universe, name');
      
      return result.rows.map(card => ({
        id: card.id,
        card_name: card.name,
        type_1: card.type1,
        type_2: card.type2,
        value_to_use: card.value_to_use,
        bonus: card.bonus,
        image: card.image_path
      }));
    } finally {
      client.release();
    }
  }

  // Basic Universe methods
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
        image: card.image_path
      }));
    } finally {
      client.release();
    }
  }

  // Card stats method
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
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM characters) as characters,
          (SELECT COUNT(*) FROM locations) as locations,
          (SELECT COUNT(*) FROM special_cards) as special_cards,
          (SELECT COUNT(*) FROM missions) as missions,
          (SELECT COUNT(*) FROM events) as events,
          (SELECT COUNT(*) FROM aspects) as aspects,
          (SELECT COUNT(*) FROM advanced_universe_cards) as advanced_universe,
          (SELECT COUNT(*) FROM teamwork_cards) as teamwork,
          (SELECT COUNT(*) FROM ally_universe_cards) as ally_universe,
          (SELECT COUNT(*) FROM training_cards) as training,
          (SELECT COUNT(*) FROM basic_universe_cards) as basic_universe,
          (SELECT COUNT(*) FROM power_cards) as power_cards
      `);
      
      const stats = result.rows[0];
      return {
        characters: parseInt(stats.characters),
        locations: parseInt(stats.locations),
        specialCards: parseInt(stats.special_cards),
        missions: parseInt(stats.missions),
        events: parseInt(stats.events),
        aspects: parseInt(stats.aspects),
        advancedUniverse: parseInt(stats.advanced_universe),
        teamwork: parseInt(stats.teamwork),
        allyUniverse: parseInt(stats.ally_universe),
        training: parseInt(stats.training),
        basicUniverse: parseInt(stats.basic_universe),
        powerCards: parseInt(stats.power_cards)
      };
    } finally {
      client.release();
    }
  }
}
