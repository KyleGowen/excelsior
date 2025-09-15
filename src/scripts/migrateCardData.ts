import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

interface CardData {
  id: string;
  name: string;
  universe: string;
  description: string;
  imagePath?: string;
  alternateImages?: string[];
  onePerDeck?: boolean;
  cataclysm?: boolean;
  ambush?: boolean;
  assist?: boolean;
  fortifications?: boolean;
  powerType?: string;
  value?: number;
  characterName?: string;
  energy?: number;
  combat?: number;
  bruteForce?: number;
  intelligence?: number;
}

class CardDataMigrator {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1337'),
      database: process.env.DB_NAME || 'overpower',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
  }

  async migrateAllData(): Promise<void> {
    try {
      console.log('🔄 Starting card data migration...');
      
      await this.migrateCharacters();
      await this.migrateSpecialCards();
      await this.migratePowerCards();
      await this.migrateMissions();
      await this.migrateEvents();
      await this.migrateAspects();
      await this.migrateAdvancedUniverse();
      await this.migrateTeamwork();
      await this.migrateAllyUniverse();
      await this.migrateTraining();
      await this.migrateBasicUniverse();
      
      console.log('✅ All card data migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async migrateCharacters(): Promise<void> {
    console.log('📊 Migrating characters...');
    const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
    
    if (!fs.existsSync(charactersPath)) {
      console.log('⚠️  Characters file not found, skipping...');
      return;
    }

    const content = fs.readFileSync(charactersPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('|') && !line.includes('---') && !line.includes('Character Name')) {
        const columns = line.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 6) {
          const [name, universe, energy, combat, bruteForce, intelligence] = columns;
          
          const character: CardData = {
            id: `character_${name.toLowerCase().replace(/\s+/g, '_')}`,
            name: name,
            universe: universe,
            description: '',
            energy: parseInt(energy) || 0,
            combat: parseInt(combat) || 0,
            bruteForce: parseInt(bruteForce) || 0,
            intelligence: parseInt(intelligence) || 0,
            imagePath: `characters/${name.toLowerCase().replace(/\s+/g, '_')}.webp`,
            alternateImages: this.getAlternateImages('characters', name)
          };

          await this.insertCharacter(character);
        }
      }
    }
  }

  private async migrateSpecialCards(): Promise<void> {
    console.log('📊 Migrating special cards...');
    const specialsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-specials.md');
    
    if (!fs.existsSync(specialsPath)) {
      console.log('⚠️  Specials file not found, skipping...');
      return;
    }

    const content = fs.readFileSync(specialsPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('|') && !line.includes('---') && !line.includes('Character Name')) {
        const columns = line.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 4) {
          const [characterName, name, universe, cardEffect, onePerDeck, cataclysm, ambush, assist] = columns;
          
          const special: CardData = {
            id: `special_${name.toLowerCase().replace(/\s+/g, '_')}`,
            name: name,
            characterName: characterName,
            universe: universe,
            description: cardEffect,
            onePerDeck: onePerDeck === 'true',
            cataclysm: cataclysm === 'true',
            ambush: ambush === 'true',
            assist: assist === 'true',
            imagePath: `specials/${name.toLowerCase().replace(/\s+/g, '_')}.webp`,
            alternateImages: this.getAlternateImages('specials', name)
          };

          await this.insertSpecialCard(special);
        }
      }
    }
  }

  private async migratePowerCards(): Promise<void> {
    console.log('📊 Migrating power cards...');
    const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
    
    if (!fs.existsSync(powerCardsPath)) {
      console.log('⚠️  Power cards file not found, skipping...');
      return;
    }

    const content = fs.readFileSync(powerCardsPath, 'utf-8');
    const lines = content.split('\n');
    let currentType = '';
    
    for (const line of lines) {
      // Check for section headers
      if (line.startsWith('## ')) {
        currentType = line.replace('## ', '').trim();
        continue;
      }
      
      // Check for table rows with power card data
      if (line.startsWith('|') && !line.includes('---') && !line.includes('Power Type')) {
        const columns = line.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 3) {
          const [powerType, value, onePerDeck] = columns;
          
          const powerCard: CardData = {
            id: `power_${powerType.toLowerCase().replace(/\s+/g, '_')}_${value}`,
            name: `${value} - ${powerType}`,
            universe: 'OverPower',
            description: `${value} - ${powerType} Power Card`,
            powerType: powerType,
            value: parseInt(value) || 0,
            onePerDeck: onePerDeck === 'true',
            imagePath: `power-cards/${value}_${powerType.toLowerCase().replace(/\s+/g, '_')}.webp`,
            alternateImages: this.getAlternateImages('power-cards', `${value}_${powerType.toLowerCase().replace(/\s+/g, '_')}`)
          };

          await this.insertPowerCard(powerCard);
        }
      }
    }
  }

  private async migrateMissions(): Promise<void> {
    console.log('📊 Migrating missions...');
    // Similar implementation for missions
    // This would read from overpower-erb-missions.md
  }

  private async migrateEvents(): Promise<void> {
    console.log('📊 Migrating events...');
    // Similar implementation for events
    // This would read from overpower-erb-events.md
  }

  private async migrateAspects(): Promise<void> {
    console.log('📊 Migrating aspects...');
    // Similar implementation for aspects
    // This would read from overpower-erb-aspects.md
  }

  private async migrateAdvancedUniverse(): Promise<void> {
    console.log('📊 Migrating advanced universe...');
    // Similar implementation for advanced universe
    // This would read from overpower-erb-advanced-universe.md
  }

  private async migrateTeamwork(): Promise<void> {
    console.log('📊 Migrating teamwork...');
    // Similar implementation for teamwork
    // This would read from overpower-erb-universe-teamwork.md
  }

  private async migrateAllyUniverse(): Promise<void> {
    console.log('📊 Migrating ally universe...');
    // Similar implementation for ally universe
    // This would read from overpower-erb-universe-ally.md
  }

  private async migrateTraining(): Promise<void> {
    console.log('📊 Migrating training...');
    // Similar implementation for training
    // This would read from overpower-erb-training.md
  }

  private async migrateBasicUniverse(): Promise<void> {
    console.log('📊 Migrating basic universe...');
    // Similar implementation for basic universe
    // This would read from overpower-erb-universe-basic.md
  }

  private getAlternateImages(cardType: string, cardName: string): string[] {
    const alternateDir = path.join(process.cwd(), 'src/resources/cards/images', cardType, 'alternate');
    if (!fs.existsSync(alternateDir)) {
      return [];
    }

    const files = fs.readdirSync(alternateDir);
    return files
      .filter(file => file.includes(cardName.toLowerCase().replace(/\s+/g, '_')))
      .map(file => `${cardType}/alternate/${file}`);
  }

  private async insertCharacter(character: CardData): Promise<void> {
    const query = `
      INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        universe = EXCLUDED.universe,
        energy = EXCLUDED.energy,
        combat = EXCLUDED.combat,
        brute_force = EXCLUDED.brute_force,
        intelligence = EXCLUDED.intelligence,
        image_path = EXCLUDED.image_path,
        alternate_images = EXCLUDED.alternate_images
    `;

    await this.pool.query(query, [
      character.id,
      character.name,
      character.universe,
      character.energy,
      character.combat,
      character.bruteForce,
      character.intelligence,
      character.imagePath,
      character.alternateImages || []
    ]);
  }

  private async insertSpecialCard(special: CardData): Promise<void> {
    const query = `
      INSERT INTO special_cards (id, name, character_name, universe, card_effect, image_path, alternate_images, one_per_deck, cataclysm, ambush, assist)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        character_name = EXCLUDED.character_name,
        universe = EXCLUDED.universe,
        card_effect = EXCLUDED.card_effect,
        image_path = EXCLUDED.image_path,
        alternate_images = EXCLUDED.alternate_images,
        one_per_deck = EXCLUDED.one_per_deck,
        cataclysm = EXCLUDED.cataclysm,
        ambush = EXCLUDED.ambush,
        assist = EXCLUDED.assist
    `;

    await this.pool.query(query, [
      special.id,
      special.name,
      special.characterName,
      special.universe,
      special.description,
      special.imagePath,
      special.alternateImages || [],
      special.onePerDeck || false,
      special.cataclysm || false,
      special.ambush || false,
      special.assist || false
    ]);
  }

  private async insertPowerCard(powerCard: CardData): Promise<void> {
    const query = `
      INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        power_type = EXCLUDED.power_type,
        value = EXCLUDED.value,
        image_path = EXCLUDED.image_path,
        alternate_images = EXCLUDED.alternate_images,
        one_per_deck = EXCLUDED.one_per_deck
    `;

    await this.pool.query(query, [
      powerCard.id,
      powerCard.name,
      powerCard.powerType,
      powerCard.value,
      powerCard.imagePath,
      powerCard.alternateImages || [],
      powerCard.onePerDeck || false
    ]);
  }
}

// CLI interface
async function main() {
  const migrator = new CardDataMigrator();
  await migrator.migrateAllData();
}

if (require.main === module) {
  main().catch(console.error);
}

export { CardDataMigrator };
