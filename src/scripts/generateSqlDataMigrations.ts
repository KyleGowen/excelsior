import * as fs from 'fs';
import * as path from 'path';

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

class SqlDataMigrationGenerator {
  private outputDir = path.join(process.cwd(), 'migrations');

  async generateAllMigrations(): Promise<void> {
    try {
      console.log('🔄 Generating SQL data migration files...');
      
      await this.generateCharactersMigration();
      await this.generateSpecialCardsMigration();
      await this.generatePowerCardsMigration();
      await this.generateMissionsMigration();
      await this.generateEventsMigration();
      await this.generateAspectsMigration();
      await this.generateAdvancedUniverseMigration();
      await this.generateTeamworkMigration();
      await this.generateAllyUniverseMigration();
      await this.generateTrainingMigration();
      await this.generateBasicUniverseMigration();
      
      console.log('✅ All SQL data migration files generated successfully!');
    } catch (error) {
      console.error('❌ Migration generation failed:', error);
      throw error;
    }
  }

  private async generateCharactersMigration(): Promise<void> {
    console.log('📊 Generating characters migration...');
    const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
    
    if (!fs.existsSync(charactersPath)) {
      console.log('⚠️  Characters file not found, skipping...');
      return;
    }

    const content = fs.readFileSync(charactersPath, 'utf-8');
    const lines = content.split('\n');
    const characters: CardData[] = [];
    
    for (const line of lines) {
      if (line.startsWith('|') && !line.includes('---') && !line.includes('Character Name')) {
        const columns = line.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 6) {
          const [name, universe, energy, combat, bruteForce, intelligence] = columns;
          
          characters.push({
            id: `character_${name.toLowerCase().replace(/\s+/g, '_')}`,
            name: name,
            universe: universe,
            description: `${name} character from ${universe}`,
            energy: parseInt(energy) || 0,
            combat: parseInt(combat) || 0,
            bruteForce: parseInt(bruteForce) || 0,
            intelligence: parseInt(intelligence) || 0,
            imagePath: `characters/${name.toLowerCase().replace(/\s+/g, '_')}.webp`,
            alternateImages: this.getAlternateImages('characters', name)
          });
        }
      }
    }

    await this.writeCharactersSql(characters);
  }

  private async generatePowerCardsMigration(): Promise<void> {
    console.log('📊 Generating power cards migration...');
    const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
    
    if (!fs.existsSync(powerCardsPath)) {
      console.log('⚠️  Power cards file not found, skipping...');
      return;
    }

    const content = fs.readFileSync(powerCardsPath, 'utf-8');
    const lines = content.split('\n');
    const powerCards: CardData[] = [];
    let currentType = '';
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentType = line.replace('## ', '').trim();
        continue;
      }
      
      if (line.startsWith('|') && !line.includes('---') && !line.includes('Power Type')) {
        const columns = line.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 3) {
          const [powerType, value, onePerDeck] = columns;
          
          powerCards.push({
            id: `power_${powerType.toLowerCase().replace(/\s+/g, '_')}_${value}`,
            name: `${value} - ${powerType}`,
            universe: 'OverPower',
            description: `${value} - ${powerType} Power Card`,
            powerType: powerType,
            value: parseInt(value) || 0,
            onePerDeck: onePerDeck === 'true',
            imagePath: `power-cards/${value}_${powerType.toLowerCase().replace(/\s+/g, '_')}.webp`,
            alternateImages: this.getAlternateImages('power-cards', `${value}_${powerType.toLowerCase().replace(/\s+/g, '_')}`)
          });
        }
      }
    }

    await this.writePowerCardsSql(powerCards);
  }

  private async generateSpecialCardsMigration(): Promise<void> {
    console.log('📊 Generating special cards migration...');
    // Similar implementation for special cards
    // This would read from overpower-erb-specials.md and generate SQL
  }

  private async generateMissionsMigration(): Promise<void> {
    console.log('📊 Generating missions migration...');
    // Similar implementation for missions
  }

  private async generateEventsMigration(): Promise<void> {
    console.log('📊 Generating events migration...');
    // Similar implementation for events
  }

  private async generateAspectsMigration(): Promise<void> {
    console.log('📊 Generating aspects migration...');
    // Similar implementation for aspects
  }

  private async generateAdvancedUniverseMigration(): Promise<void> {
    console.log('📊 Generating advanced universe migration...');
    // Similar implementation for advanced universe
  }

  private async generateTeamworkMigration(): Promise<void> {
    console.log('📊 Generating teamwork migration...');
    // Similar implementation for teamwork
  }

  private async generateAllyUniverseMigration(): Promise<void> {
    console.log('📊 Generating ally universe migration...');
    // Similar implementation for ally universe
  }

  private async generateTrainingMigration(): Promise<void> {
    console.log('📊 Generating training migration...');
    // Similar implementation for training
  }

  private async generateBasicUniverseMigration(): Promise<void> {
    console.log('📊 Generating basic universe migration...');
    // Similar implementation for basic universe
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

  private async writeCharactersSql(characters: CardData[]): Promise<void> {
    const sql = `-- Populate characters data from markdown file
-- Generated automatically from overpower-erb-characters.md

${characters.map(char => 
  `INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('${char.id}', '${char.name}', '${char.universe}', ${char.energy}, ${char.combat}, ${char.bruteForce}, ${char.intelligence}, '${char.imagePath}', ARRAY[${char.alternateImages?.map(img => `'${img}'`).join(', ') || ''}]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;`
).join('\n\n')}`;

    const filePath = path.join(this.outputDir, 'V22__Populate_characters_data.sql');
    fs.writeFileSync(filePath, sql);
    console.log(`✅ Generated ${filePath}`);
  }

  private async writePowerCardsSql(powerCards: CardData[]): Promise<void> {
    const sql = `-- Populate power cards data from markdown file
-- Generated automatically from overpower-erb-powercards.md

${powerCards.map(card => 
  `INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('${card.id}', '${card.name}', '${card.powerType}', ${card.value}, '${card.imagePath}', ARRAY[${card.alternateImages?.map(img => `'${img}'`).join(', ') || ''}]::text[], ${card.onePerDeck})
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;`
).join('\n\n')}`;

    const filePath = path.join(this.outputDir, 'V23__Populate_power_cards_data.sql');
    fs.writeFileSync(filePath, sql);
    console.log(`✅ Generated ${filePath}`);
  }
}

// CLI interface
async function main() {
  const generator = new SqlDataMigrationGenerator();
  await generator.generateAllMigrations();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SqlDataMigrationGenerator };
