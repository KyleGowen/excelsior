import { Character, Location, SpecialCard, Mission, Event, Aspect, AdvancedUniverse, Teamwork, AllyUniverse, TrainingCard, BasicUniverse, PowerCard } from '../types';
import { CardRepository } from '../repository/CardRepository';
import * as fs from 'fs';
import * as path from 'path';

export class InMemoryCardRepository implements CardRepository {
  private characters: Map<string, Character> = new Map();
  private locations: Map<string, Location> = new Map();
  private specialCards: Map<string, SpecialCard> = new Map();
  private missions: Map<string, Mission> = new Map();
  private events: Map<string, Event> = new Map();
  private aspects: Map<string, Aspect> = new Map();
  private advancedUniverse: Map<string, AdvancedUniverse> = new Map();
  private teamwork: Map<string, Teamwork> = new Map();
  private allyUniverse: Map<string, AllyUniverse> = new Map();
  private trainings: Map<string, TrainingCard> = new Map();
  private basicUniverse: Map<string, BasicUniverse> = new Map();
  private powerCards: Map<string, PowerCard> = new Map();
  
  private nextCharacterId = 1;
  private nextLocationId = 1;
  private nextSpecialCardId = 1;
  private nextMissionId = 1;
  private nextEventId = 1;
  private nextAspectId = 1;
  private nextAdvancedUniverseId = 1;
  private nextTeamworkId = 1;
  private nextAllyUniverseId = 1;
  private nextTrainingId = 1;
  private nextBasicUniverseId = 1;
  private nextPowerCardId = 1;

  async initialize(): Promise<void> {
    console.log('🗄️ Initializing clean database schema...');
    
    // Load characters from the markdown file
    await this.loadCharacters();
    
    // Load locations from the markdown file
    await this.loadLocations();
    
    // Load special cards from the markdown file
    await this.loadSpecialCards();
    
    // Load missions from the markdown file
    await this.loadMissions();
    
    // Load events from the markdown file
    await this.loadEvents();
    
    // Load aspects from the markdown file
    await this.loadAspects();
    
    // Load advanced universe from the markdown file
    await this.loadAdvancedUniverse();
    
    // Load teamwork from the markdown file
    await this.loadTeamwork();

    // Load Ally Universe from the markdown file
    await this.loadAllyUniverse();

    // Load Training from the markdown file
    await this.loadTraining();

    // Load Basic Universe from the markdown file
    await this.loadBasicUniverse();

    // Load Power Cards from the markdown file
    await this.loadPowerCards();
    
    console.log('✅ Database initialization complete');
    console.log(`📊 Database loaded: ${this.characters.size} characters, ${this.locations.size} locations, ${this.specialCards.size} special cards, ${this.missions.size} missions, ${this.events.size} events, ${this.aspects.size} aspects, ${this.advancedUniverse.size} advanced universe, ${this.teamwork.size} teamwork, ${this.allyUniverse.size} ally universe, ${this.trainings.size} trainings, ${this.basicUniverse.size} basic universe, ${this.powerCards.size} power cards`);
  }

  // Character management
  async getCharacterById(id: string): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }

  // Special card management
  async getSpecialCardById(id: string): Promise<SpecialCard | undefined> {
    return this.specialCards.get(id);
  }

  async getAllSpecialCards(): Promise<SpecialCard[]> {
    return Array.from(this.specialCards.values());
  }

  // Power card management
  async getPowerCardById(id: string): Promise<PowerCard | undefined> {
    return this.powerCards.get(id);
  }

  async getAllPowerCards(): Promise<PowerCard[]> {
    return Array.from(this.powerCards.values());
  }

  // Location management
  async getLocationById(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  // Mission management
  async getMissionById(id: string): Promise<Mission | undefined> {
    return this.missions.get(id);
  }

  async getAllMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values());
  }

  // Event management
  async getEventById(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  // Aspect management
  async getAspectById(id: string): Promise<Aspect | undefined> {
    return this.aspects.get(id);
  }

  async getAllAspects(): Promise<Aspect[]> {
    return Array.from(this.aspects.values());
  }

  // Advanced Universe management
  async getAdvancedUniverseById(id: string): Promise<AdvancedUniverse | undefined> {
    return this.advancedUniverse.get(id);
  }

  async getAllAdvancedUniverse(): Promise<AdvancedUniverse[]> {
    return Array.from(this.advancedUniverse.values());
  }

  // Teamwork management
  async getTeamworkById(id: string): Promise<Teamwork | undefined> {
    return this.teamwork.get(id);
  }

  async getAllTeamwork(): Promise<Teamwork[]> {
    return Array.from(this.teamwork.values());
  }

  // Ally Universe management
  async getAllAllyUniverse(): Promise<AllyUniverse[]> {
    return Array.from(this.allyUniverse.values());
  }

  // Training management
  async getAllTraining(): Promise<TrainingCard[]> {
    return Array.from(this.trainings.values());
  }

  // Basic Universe management
  async getAllBasicUniverse(): Promise<BasicUniverse[]> {
    return Array.from(this.basicUniverse.values());
  }

  // Image management
  async getCharacterEffectiveImage(characterId: string, selectedAlternateImage?: string): Promise<string> {
    const character = this.characters.get(characterId);
    if (!character) {
      return '';
    }
    
    // If a specific alternate image is selected, use it
    if (selectedAlternateImage && character.alternateImages?.includes(selectedAlternateImage)) {
      return `characters/alternate/${selectedAlternateImage}`;
    }
    
    // Otherwise, use the default image
    return character.image;
  }

  async getSpecialCardEffectiveImage(specialCardId: string, selectedAlternateImage?: string): Promise<string> {
    const specialCard = this.specialCards.get(specialCardId);
    if (!specialCard) {
      return '';
    }
    
    // If a specific alternate image is selected, use it
    if (selectedAlternateImage && specialCard.alternateImages?.includes(selectedAlternateImage)) {
      return `specials/alternate/${selectedAlternateImage}`;
    }
    
    // Otherwise, use the default image
    return specialCard.image;
  }

  async getPowerCardEffectiveImage(powerCardId: string, selectedAlternateImage?: string): Promise<string> {
    const powerCard = this.powerCards.get(powerCardId);
    if (!powerCard) {
      return '';
    }
    
    // If a specific alternate image is selected, use it
    if (selectedAlternateImage && powerCard.alternateImages?.includes(selectedAlternateImage)) {
      return `power-cards/alternate/${selectedAlternateImage}`;
    }
    
    // Otherwise, use the default image
    return powerCard.image;
  }

  // Statistics
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
    return {
      characters: this.characters.size,
      locations: this.locations.size,
      specialCards: this.specialCards.size,
      missions: this.missions.size,
      events: this.events.size,
      aspects: this.aspects.size,
      advancedUniverse: this.advancedUniverse.size,
      teamwork: this.teamwork.size,
      allyUniverse: this.allyUniverse.size,
      training: this.trainings.size,
      basicUniverse: this.basicUniverse.size,
      powerCards: this.powerCards.size
    };
  }

  // Private methods for loading data from files
  private async loadCharacters(): Promise<void> {
    try {
      console.log('📖 Loading characters from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Character file not found, skipping character loading');
        return;
      }

      console.log('📖 Reading character data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      const totalLines = lines.length;

      for (const line of lines) {
        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Name')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 9) { // Split by | creates 9 elements for 8 columns
            const characterName = columns[1];
            const alternateImages = this.getCharacterAlternateImages(characterName);
            
            const character: Character = {
              id: `char_${this.nextCharacterId++}`,
              name: characterName,
              energy: parseInt(columns[2]) || 0,
              combat: parseInt(columns[3]) || 0,
              brute_force: parseInt(columns[4]) || 0,
              intelligence: parseInt(columns[5]) || 0,
              threat_level: parseInt(columns[6]) || 0,
              special_abilities: columns[7] || '',
              image: columns[8],
              ...(alternateImages.length > 0 && { alternateImages })
            };

            this.characters.set(character.id, character);
            loadedCount++;

            if (loadedCount % 10 === 0) {
              console.log(`   Loaded ${loadedCount}/${totalLines} characters...`);
            }
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} characters into database!`);
      console.log('✅ Characters loaded successfully');
    } catch (error) {
      console.error('❌ Error loading characters:', error);
    }
  }

  private async loadLocations(): Promise<void> {
    try {
      console.log('📖 Loading locations from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-locations.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Locations file not found, skipping location loading');
        return;
      }

      console.log('📖 Reading location data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      const totalLines = lines.length;

      for (const line of lines) {
        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Name')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 4) { // Split by | creates 4+ elements for 3 columns
            const location: Location = {
              id: `loc_${this.nextLocationId++}`,
              name: columns[1],
              threat_level: parseInt(columns[2]) || 0,
              special_ability: columns[3] || '',
              image: this.getLocationImage(columns[1])
            };

            this.locations.set(location.id, location);
            loadedCount++;
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} locations into database!`);
      console.log('✅ Locations loaded successfully');
    } catch (error) {
      console.error('❌ Error loading locations:', error);
    }
  }

  private async loadSpecialCards(): Promise<void> {
    try {
      console.log('📖 Loading special cards from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-specials.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Special cards file not found, skipping special card loading');
        return;
      }

      console.log('📖 Reading special card data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      const totalLines = lines.length;

      for (const line of lines) {
        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Card Name')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 5) { // Split by | creates 5+ elements for 4 columns
            const cardName = columns[1];
            const alternateImages = this.getSpecialCardAlternateImages(cardName);
            
            const specialCard: SpecialCard = {
              id: `special_${this.nextSpecialCardId++}`,
              name: cardName,
              card_type: columns[2],
              character: columns[3],
              card_effect: columns[4],
              image: this.getSpecialCardImage(cardName),
              is_cataclysm: columns[4].includes('**Cataclysm!**'),
              one_per_deck: columns[4].includes('**One Per Deck**'),
              ...(alternateImages.length > 0 && { alternateImages })
            };

            this.specialCards.set(specialCard.id, specialCard);
            loadedCount++;

            if (loadedCount % 10 === 0) {
              console.log(`   Loaded ${loadedCount}/${totalLines} special cards...`);
            }
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} special cards into database!`);
      console.log('✅ Special cards loaded successfully');
    } catch (error) {
      console.error('❌ Error loading special cards:', error);
    }
  }

  // ... (I'll continue with the rest of the private methods in the next part)
  // This is getting quite long, so I'll split it into multiple parts

  private getLocationImage(locationName: string): string {
    // Map location names to their image files
    const locationImageMap: { [key: string]: string } = {
      "Dracula's Armory": 'locations/465_draculas_armory.webp',
      "Spartan Training Ground": 'locations/466_spartan_training_ground.webp',
      "The Round Table": 'locations/467_the_round_table.webp',
      "Barsoom": 'locations/468_barsoom.webp',
      "Asclepieion": 'locations/469_ascleipeion.webp',
      "221-B Baker St.": 'locations/470_221b_baker_st.webp',
      "Event Horizon: The Future": 'locations/471_horizon.webp',
      "The Land That Time Forgot": 'locations/472_the_land_that_time_forgot.webp'
    };
    
    return locationImageMap[locationName] || 'unknown_location.webp';
  }

  private getCharacterAlternateImages(characterName: string): string[] {
    const alternateImages: string[] = [];
    const alternateDir = path.join(process.cwd(), 'src/resources/cards/images/characters/alternate');
    
    if (!fs.existsSync(alternateDir)) {
      return alternateImages;
    }
    
    try {
      const files = fs.readdirSync(alternateDir);
      const characterNameLower = characterName.toLowerCase();
      
      for (const file of files) {
        if (file.endsWith('.webp') || file.endsWith('.png')) {
          const fileName = file.toLowerCase().replace(/\.(webp|png)$/, '');
          // Check if the filename starts with the character name (case insensitive)
          // This handles cases like "dracula.webp", "dracula2.webp", etc.
          if (fileName === characterNameLower || fileName.startsWith(characterNameLower)) {
            alternateImages.push(file);
          }
        }
      }
    } catch (error) {
      console.error('Error reading alternate images directory:', error);
    }
    
    return alternateImages;
  }

  private getSpecialCardAlternateImages(cardName: string): string[] {
    const alternateImages: string[] = [];
    const alternateDir = path.join(process.cwd(), 'src/resources/cards/images/specials/alternate');
    
    if (!fs.existsSync(alternateDir)) {
      return alternateImages;
    }
    
    try {
      const files = fs.readdirSync(alternateDir);
      const cardNameLower = cardName.toLowerCase();
      const snakeCaseName = this.convertToSnakeCase(cardName);
      
      for (const file of files) {
        if (file.endsWith('.webp') || file.endsWith('.png')) {
          const fileName = file.toLowerCase().replace(/\.(webp|png)$/, '');
          // Check if the filename matches the card name (case insensitive)
          // This handles cases like "the_gemini.webp" for "The Gemini"
          if (fileName === cardNameLower || fileName === snakeCaseName || 
              fileName.includes(cardNameLower) || fileName.includes(snakeCaseName)) {
            alternateImages.push(file);
          }
        }
      }
    } catch (error) {
      console.error('Error reading special card alternate images directory:', error);
    }
    
    return alternateImages;
  }

  private getPowerCardAlternateImages(powerType: string, value: number): string[] {
    const alternateImages: string[] = [];
    const alternateDir = path.join(process.cwd(), 'src/resources/cards/images/power-cards/alternate');
    
    if (!fs.existsSync(alternateDir)) {
      return alternateImages;
    }
    
    try {
      const files = fs.readdirSync(alternateDir);
      const powerTypeLower = powerType.toLowerCase().replace(/\s+/g, '_');
      
      for (const file of files) {
        if (file.endsWith('.webp') || file.endsWith('.png')) {
          const fileName = file.toLowerCase().replace(/\.(webp|png)$/, '');
          // Check if the filename matches the power type and value
          // This handles cases like "8_intelligence.webp" for Intelligence power cards with value 8
          if (fileName === `${value}_${powerTypeLower}` || 
              fileName.startsWith(`${value}_${powerTypeLower}`)) {
            alternateImages.push(file);
          }
        }
      }
    } catch (error) {
      console.error('Error reading power card alternate images directory:', error);
    }
    
    return alternateImages;
  }

  private convertToSnakeCase(cardName: string): string {
    return cardName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim();
  }

  private getSpecialCardImage(cardName: string): string {
    // Convert card name to snake_case for intelligent matching
    const snakeCaseName = this.convertToSnakeCase(cardName);
    
    // Debug Victory Harben cards
    if (cardName.includes('Abner Perry') || cardName.includes('Archery') || cardName.includes('Chamston')) {
      console.log(`🔍 Debugging Victory Harben card: ${cardName}`);
      console.log(`  Snake case: ${snakeCaseName}`);
    }
    
    // Debug Merlin's Magic card
    if (cardName.includes('Merlin') || cardName.includes('merlin')) {
      console.log(`🔍 Debugging Merlin card: ${cardName}`);
      console.log(`  Snake case: ${snakeCaseName}`);
    }
    
    // First try to find an exact match with the snake_case name
    const availableImages = this.getAvailableSpecialCardImages();
    
    // Handle specific known mismatches based on actual existing images
    const knownMismatches: { [key: string]: string } = {
      // Cthulhu special cards - map to actual existing images
      'ancient_one': 'specials/049_ancient_one.webp',
      'devoted_follower': 'specials/050_devoted_follower.webp', 
      'distracting_intervention': 'specials/051_distracting_intervention.webp',
      'network_of_fanatics': 'specials/052_network_of_fanatics.webp',
      'the_call_of_cthulhu': 'specials/053_call_of_cthulhu.webp',
      'the_sleeper_awakens': 'specials/054_the_sleeper_awakens.webp',
      
      // Carson of Venus special cards - map to correct image files
      'janjong_duare_mintep': 'specials/036_janjong_duare_mintep.webp',
      'on_the_razors_edge': 'specials/037_on_a_razors_edge.webp',
      'telepathic_resistance': 'specials/038_telepathic_resistance.webp',
      'sometimes_piracy_is_the_best_option': 'specials/039_sometimes_piracy_is_the_best_option.webp',
      't_ray_gun': 'specials/040_tray_guns.webp',
      'telepathic_training': 'specials/041_telepathic_training.webp',
      
      // Any Character special cards - these should work with existing logic
      'heimdall': 'specials/439_heimdall.webp',
      'lady_of_the_lake': 'specials/440_lady_of_the_lake.webp',
      'robin_hood_master_thief': 'specials/441_robin_hood_master_thief.webp',
      'tunupa_mountain_god': 'specials/442_tunupa_mountain_god.webp',
      'fairy_protection': 'specials/443_fairy_protection.webp',
      'loki': 'specials/444_loki.webp',
      'wrath_of_ra': 'specials/445_wrath_of_ra.webp',
      'valkyrie_skeggold': 'specials/446_valkyrie_skeggold.webp',
      'oni_and_succubus': 'specials/447_oni_and_succubus.webp',
      'bodhisattava_enlightened_one': 'specials/448_bodhisattava_enlightened_one.webp',
      'mystical_energy': 'specials/449_mystical_energy.webp',
      'charge_into_battle': 'specials/450_charge_into_battle.webp',
      'subjugate_the_meek': 'specials/451_subjugate_the_meek.webp',
      'draconic_leadership': 'specials/452_draconic_leadership.webp',
      'liliths_swarm': 'specials/453_liliths_swarm.webp',
      'disorient_opponent': 'specials/454_disorient_opponent.webp',
      'freya_goddess_of_protection': 'specials/455_freya_goddess_of_protection.webp',
      'grim_reaper': 'specials/456_grim_reaper.webp',
      'gunnr': 'specials/457_gunnr.webp',
      'hades_lord_of_the_underworld': 'specials/458_hades_lord_of_the_underworld.webp',
      'legendary_escape': 'specials/459_legendary_escape.webp',
      'merlins_magic': 'specials/460_merlins_magic.webp',
      'preternatural_healing': 'specials/461_preternatural_healing.webp',
      'princess_and_the_pea': 'specials/462_princess_and_the_pea.webp',
      'the_gemni': 'specials/463_the_gemni.webp',
      'valkyrie_hilder': 'specials/464_valkyrie_hilder.webp',
      
      // Victory Harben special cards - map to correct image files
      'abner_perrys_lab_assistant': 'specials/266_abner_perrys_lab_assistant.webp',
      'archery_knives_jiujitsu': 'specials/267_archery_knives_and_jiu_jitsu.webp',
      'chamstonhedding_estate': 'specials/268_chamston-hedding_estate.webp',
      
      // Count of Monte Cristo special cards - map to correct image files
      'friend_to_foe': 'specials/043_friend_or_foe.webp',
      'jacopo': 'specials/044_jacopo.webp',
      'network_of_thieves': 'specials/045_network_of_theives.webp',
      'surprise_swordsman': 'specials/046_suprise_swordsman.webp',
      'unlimited_resources': 'specials/047_unlimited_resources.webp',
      
      // Professor Moriarty special cards - map to correct image files
      'mathematical_genius': 'specials/185_mathematical_genius.webp'
    };
    
    if (knownMismatches[snakeCaseName]) {
      if (cardName.includes('Abner Perry') || cardName.includes('Archery') || cardName.includes('Chamston')) {
        console.log(`  ✅ Found in knownMismatches: ${knownMismatches[snakeCaseName]}`);
      }
      return knownMismatches[snakeCaseName];
    }
    
    // Look for exact matches first
    for (const imageFile of availableImages) {
      if (imageFile.includes(snakeCaseName)) {
        return imageFile;
      }
    }
    
    // Try matching without the ID prefix
    const nameWithoutId = snakeCaseName.replace(/^\d+_/, '');
    for (const imageFile of availableImages) {
      const imageNameWithoutId = imageFile.replace(/^\d+_/, '').replace('.webp', '');
      if (imageNameWithoutId === nameWithoutId) {
        return imageFile;
      }
    }
    
    // Try singular/plural variations and word transformations
    const transformedNames = this.generateNameVariations(snakeCaseName);
    for (const transformedName of transformedNames) {
      for (const imageFile of availableImages) {
        const imageName = imageFile.replace(/^\d+_/, '').replace('.webp', '');
        if (imageName.includes(transformedName) || transformedName.includes(imageName)) {
          return imageFile;
        }
      }
    }
    
    // Try partial word matching with better logic
    const words = snakeCaseName.split('_').filter(word => word.length > 2); // Filter out very short words
    for (const imageFile of availableImages) {
      const imageWords = imageFile.replace(/^\d+_/, '').replace('.webp', '').split('_');
      
      // Check if most words match (at least 70% of words)
      const matchingWords = words.filter(word => 
        imageWords.some(imgWord => 
          imgWord.includes(word) || 
          word.includes(imgWord) || 
          this.levenshteinDistance(word, imgWord) <= 2
        )
      );
      
      if (matchingWords.length >= words.length * 0.7) {
        return imageFile;
      }
    }
    
    // Try fuzzy matching for similar names
    for (const imageFile of availableImages) {
      const imageName = imageFile.replace(/^\d+_/, '').replace('.webp', '');
      if (this.levenshteinDistance(snakeCaseName, imageName) <= 3) {
        return imageFile;
      }
    }
    
    // Fallback to unknown image
    return 'unknown_special_card.webp';
  }

  private generateNameVariations(name: string): string[] {
    const variations = [name];
    const words = name.split('_');
    
    // Generate singular/plural variations
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let variation = [...words];
      
      // Common plural to singular transformations
      if (word.endsWith('s') && word.length > 3) {
        variation[i] = word.slice(0, -1); // Remove 's'
        variations.push(variation.join('_'));
      }
      
      // Common singular to plural transformations
      if (!word.endsWith('s') && word.length > 2) {
        variation[i] = word + 's'; // Add 's'
        variations.push(variation.join('_'));
      }
      
      // Handle specific word variations
      if (word === 'champion') {
        variation[i] = 'champions';
        variations.push(variation.join('_'));
      }
      if (word === 'champions') {
        variation[i] = 'champion';
        variations.push(variation.join('_'));
      }
      if (word === 'hero') {
        variation[i] = 'heroes';
        variations.push(variation.join('_'));
      }
      if (word === 'heroes') {
        variation[i] = 'hero';
        variations.push(variation.join('_'));
      }
      if (word === 'knights') {
        variation[i] = 'knight';
        variations.push(variation.join('_'));
      }
      if (word === 'knight') {
        variation[i] = 'knights';
        variations.push(variation.join('_'));
      }
    }
    
    return variations;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private getAvailableSpecialCardImages(): string[] {
    // Return a list of available special card image files
    // This would ideally be loaded from the filesystem, but for now we'll hardcode the known ones
    return [
      // Any Character special cards (439-464)
      "specials/439_heimdall.webp", "specials/440_lady_of_the_lake.webp", "specials/441_robin_hood_master_thief.webp",
      "specials/442_tunupa_mountain_god.webp", "specials/443_fairy_protection.webp", "specials/444_loki.webp", "specials/445_wrath_of_ra.webp",
      "specials/446_valkyrie_skeggold.webp", "specials/447_oni_and_succubus.webp", "specials/448_bodhisattava_enlightened_one.webp",
      "specials/449_mystical_energy.webp", "specials/450_charge_into_battle.webp", "specials/451_subjugate_the_meek.webp",
      "specials/452_draconic_leadership.webp", "specials/453_liliths_swarm.webp", "specials/454_disorient_opponent.webp",
      "specials/455_freya_goddess_of_protection.webp", "specials/456_grim_reaper.webp", "specials/457_gunnr.webp", "specials/458_hades_lord_of_the_underworld.webp",
      "specials/459_legendary_escape.webp", "specials/460_merlins_magic.webp", "specials/461_preternatural_healing.webp",
      "specials/462_princess_and_the_pea.webp", "specials/463_the_gemni.webp", "specials/464_valkyrie_hilder.webp",
      
      // Character-specific special cards (001-291)
      "specials/001_angry_mob_middle_ages.webp", "specials/002_dont_let_it_get_away.webp", "specials/003_mob_mentality.webp",
      "specials/004_strength_in_numbers.webp", "specials/005_swarm_them.webp", "specials/006_pitchforks_and_torches.webp",
      "specials/007_regent_of_the_crown.webp", "specials/008_angry_mob_industrial_age.webp", "specials/009_disrupt_supply_lines.webp",
      "specials/010_union_power.webp", "specials/011_angry_mob_modern_age.webp", "specials/012_online_cyber_attack.webp",
      "specials/013_ransom_your_secrets.webp", "specials/014_anubis.webp", "specials/015_book_of_the_dead.webp",
      "specials/016_lord_of_the_sacred_land.webp", "specials/017_shepherd_of_the_damned.webp", "specials/018_syphon_strike.webp",
      "specials/019__weighing_ofthe_heart.webp", "specials/020_wither.webp", "specials/021_billy_the_kid.webp",
      "specials/022_head_for_mexico.webp", "specials/023_ill_make_you_famous.webp", "specials/024_pals.webp",
      "specials/025_quick_draw.webp", "specials/026_reap_the_whirlwind.webp", "specials/027_regulators.webp",
      "specials/028_captain_nemo.webp", "specials/029_ethnologist.webp", "specials/030_never_set_foot_on_dry_land.webp",
      "specials/031_silent_running.webp", "specials/032_ruthless_plunderer.webp", "specials/033_the_nautilus.webp",
      "specials/034_weapons_of_wrath_and_hatred.webp", "specials/036_janjong_duare_mintep.webp", "specials/037_on_a_razors_edge.webp",
      "specials/038_telepathic_resistance.webp", "specials/039_sometimes_piracy_is_the_best_option.webp", "specials/040_tray_guns.webp",
      "specials/041_telepathic_training.webp", "specials/043_friend_or_foe.webp", "specials/044_jacopo.webp",
      "specials/049_ancient_one.webp", "specials/050_devoted_follower.webp", "specials/051_distracting_intervention.webp",
      "specials/052_network_of_fanatics.webp", "specials/053_call_of_cthulhu.webp", "specials/054_the_sleeper_awakens.webp",
      "specials/056_warrior_of_helium.webp", "specials/057_diplomat_to_all_martians.webp", "specials/058_fortune_of_helium.webp",
      "specials/059_head_of_martian_science.webp", "specials/060_protector_of_barsoom.webp", "specials/061_champions_of_barsoom.webp",
      "specials/063_all_chips_on_the_table.webp", "specials/064_blackheath_rugby_star.webp", "specials/065_british_army_surgeon.webp",
      "specials/066_english_gentleman.webp", "specials/067_not_a_bad_detective.webp", "specials/068_always_there_for_a_friend.webp",
      "specials/070_crimson_restoration.webp", "specials/071_veil_of_deceit.webp", "specials/072_lord_of_the_vampires.webp",
      "specials/073_paralyzing_gaze.webp", "specials/074_to_the_last_man.webp", "specials/075_undead_flesh.webp",
      "specials/077_decapitate.webp", "specials/078_human_spine_whip.webp", "specials/079_mark_of_the_headless.webp",
      "specials/080_pumpkin_head.webp", "specials/081_relentless_hessian.webp",       "specials/082_vissage_of_terror.webp",
      "specials/084_sowing_chaos.webp", "specials/085_great_club.webp", "specials/086_lion_skin_cloak.webp",
      "specials/087_godly_prowess.webp", "specials/088_protector_of_mankind.webp", "specials/089_slaying_the_hydra.webp",
      "specials/091_didnt_see_it_coming.webp", "specials/092_hidden_sociopath.webp", "specials/093_im_in_your_house.webp",
      "specials/094_ive_murderd_before.webp", "specials/095_one_at_a_time.webp",       "specials/096_run_and_hide.webp",
      "specials/098_archimedes_q_porter.webp", "specials/099_ethnoarchiology.webp", "specials/100_tenacious_persuit.webp",
      "specials/101_lady_of_the_jungle.webp", "specials/102_not_without_my_friends.webp", "specials/103_not_a_damsel_in_distress.webp",
      "specials/105_angelic_visions.webp", "specials/106_burned_at_the_stake.webp", "specials/107_early_feminist_leader.webp",
      "specials/108_inspirational_leadership.webp", "specials/109_patron_saint_of_france.webp",       "specials/110_protection_of_saint_michael.webp",
      "specials/112_dotar_sojat.webp", "specials/113_immortality.webp", "specials/114_leap_into_the_fray.webp",
      "specials/115_lower_gravity.webp", "specials/116_superhuman_endurance.webp", "specials/117_virginia_fighting_man.webp",
      "specials/119_excalibur.webp", "specials/120_king_of_camelot.webp", "specials/121_knights_of_the_round_table.webp",
      "specials/122_legendary_partnership.webp", "specials/123_heavy_is_the_head.webp",       "specials/124_lead_from_the_front.webp",
      "specials/126_john_clayton_lll.webp", "specials/127_jungle_survival_en_108.webp", "specials/128_like_father_like_son.webp",
      "specials/129_meriem_and_jackie_clayton.webp", "specials/130_son_of_the_jungle.webp", "specials/131_to_the_death.webp",
      "specials/133_chivalrous_protector.webp", "specials/134_for_quinevere_s_love.webp", "specials/135_for_the_queen.webp",
      "specials/136_knight_of_the_round_table.webp", "specials/137_sword_and_shield.webp", "specials/138_true_strike.webp",
      "specials/140_300.webp", "specials/141_baptized_in_combat.webp",       "specials/142_for_sparta.webp",
      "specials/143_give_them_nothing.webp", "specials/144_greatest_soldiers_in_history.webp", "specials/145_shield_phalanx.webp",
      "specials/147_archimedes.webp", "specials/148_ascendant_mage.webp", "specials/149_for_camelot.webp",
      "specials/150_fortell_the_future.webp", "specials/151_shapeshift.webp", "specials/152_summon_the_elements.webp",
      "specials/154_dracluas_telepathic_connection.webp", "specials/155_john_harker_solicitor.webp", "specials/156_nocturnal_hunter.webp",
      "specials/157_the_hunger.webp", "specials/158_tracking_movement.webp",       "specials/159_vampiric_celerity.webp",
      "specials/161_apprentice_of_merlin.webp", "specials/162_avalons_warmth.webp", "specials/163_duality.webp",
      "specials/164_enchantress__guile.webp", "specials/165_shapeshifters_guise.webp", "specials/166_teleportation_circle.webp",
      "specials/168_overdose.webp", "specials/169_sadistic_tendencies.webp", "specials/170_set_loose.webp",
      "specials/171_the_serum.webp", "specials/172_trample.webp", "specials/173_victorian_sophisticant.webp",
      "specials/175_reclaim_the_water.webp", "specials/176_form_of_water.webp",       "specials/177_poseidons_might.webp",
      "specials/178_rising_tides.webp", "specials/179_trident.webp", "specials/180_tsunami.webp",
      "specials/182_complex_criminal_scheme.webp", "specials/183_criminal_mastermind.webp", "specials/184_future_plans.webp",
      "specials/185_mathmatical_genius.webp", "specials/186_napoleon_of_crime.webp", "specials/187_tactical_fighter.webp",
      "specials/189_clut_of_mnevis_bull.webp", "specials/190_eye_of_sekhmet.webp", "specials/191_healing_waters_of_the_nile.webp",
      "specials/196_band_of_merry_men.webp", "specials/197_defender_of_the_people.webp",       "specials/198_hero_of_nottingham.webp",
      "specials/199_master_archer.webp", "specials/200_master_theif.webp", "specials/201_steal_from_the_rich.webp",
      "specials/203_flaming_arrows.webp", "specials/204_i_command_an_army.webp", "specials/205_read_the_bones.webp",
      "specials/206_rule_by_fear.webp", "specials/207_squeeze_the_commoners.webp", "specials/208_taxes.webp",
      "specials/210_battle_of_wits.webp", "specials/211_brilliant_deduction.webp", "specials/212_irene_adler.webp",
      "specials/213_logical_reasoning.webp", "specials/214_probability_evaluation.webp",       "specials/215_unpredictable_mind.webp",
      "specials/217_cloud_surfing.webp", "specials/218_godly_strength.webp", "specials/219_grasp_of_the_five_elements.webp",
      "specials/220_staff_of_the_monkey_king.webp", "specials/221_stone_skin.webp", "specials/222_transformation_trickery.webp",
      "specials/224_avenging_my_love.webp", "specials/225_barsoom_warrior_and_statesman.webp", "specials/226_four_armed_warrior.webp",
      "specials/227_jeddak_of_thark.webp", "specials/228_protector_of_the_incubator.webp", "specials/229_sola.webp",
      "specials/231_emotional_senses.webp", "specials/232_jungle_tactics.webp",       "specials/233_lord_of_the_jungle.webp",
      "specials/234_my_feet_are_like_hands.webp", "specials/235_raised_by_mangani_apes.webp", "specials/236_deceptive_manuver.webp",
      "specials/238_ancient_wisdom.webp", "specials/239_fury_of_the_desert.webp", "specials/240_pharaoh_of_the_fourth_dynasty.webp",
      "specials/241_reinvigorated_by_fresh_organs.webp", "specials/242_relentless_pursuit.webp", "specials/243_the_eternal_jouney.webp",
      "specials/245_all_for_one.webp", "specials/246_aramis.webp", "specials/247_athos.webp",
      "specials/248_dartagnan.webp", "specials/249_porthos.webp",       "specials/250_valient_charge.webp",
      "specials/252_from_a_mile_away.webp", "specials/253_futuristic_phaser.webp", "specials/254_i_ll_already_be_gone.webp",
      "specials/255_knowledge_of_tomorrow.webp", "specials/256_harbingers_warning.webp", "specials/257_the_tomorrow_doctor.webp",
      "specials/259_doctor_profesor.webp", "specials/260_monster_hunting_expert.webp", "specials/261_crossbow_expert.webp",
      "specials/262_right_tool_for_the_job.webp", "specials/263_sacred_wafers_of_amsterdam.webp", "specials/264_world_renowned_doctor.webp",
      "specials/266_abner_perrys_lab_assistant.webp", "specials/267_archery_knives_and_jiu_jitsu.webp",       "specials/268_chamston-hedding_estate.webp",
      "specials/269_department_of_theoretical_physics.webp", "specials/270_fires_of_halos.webp",       "specials/271_practical_physics.webp",
      "specials/273_aquaphobic.webp", "specials/274_feard_by_all_witches.webp", "specials/275_i_will_have_those_silver_shoes.webp",
      "specials/276_one_eye.webp", "specials/277_harness_the_wind.webp",       "specials/278_wolves_crows_black_birds_en_237.webp",
      "specials/280_a_jealous_god.webp", "specials/281_banishment.webp", "specials/282_hera.webp",
      "specials/283_law_and_order.webp", "specials/284_thunderbolt.webp", "specials/286_3_quick_strokes.webp",
      "specials/287_elite_swordsmanship.webp", "specials/288_master_of_escape.webp", "specials/289_ancestial_rapier.webp",
      "specials/290_riches_of_don_diego_de_la_vega.webp",       "specials/291_reposte.webp"
    ];
  }

  // Additional loading methods for missions, events, aspects, etc.
  private async loadMissions(): Promise<void> {
    try {
      console.log('📖 Loading missions from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-missions.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Missions file not found, skipping mission loading');
        return;
      }

      console.log('📖 Reading mission data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      let currentMissionSet = '';
      let missionIndex = 1;

      for (const line of lines) {
        // Check if this is a mission set header
        if (line.startsWith('## ')) {
          currentMissionSet = line.replace('## ', '').trim();
          missionIndex = 1;
          continue;
        }

        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Mission Set')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 3) { // Split by | creates 3+ elements for 2 columns
            const mission: Mission = {
              id: `mission_${this.nextMissionId++}`,
              mission_set: currentMissionSet,
              card_name: columns[2],
              image: this.getMissionImage(currentMissionSet, columns[2], missionIndex)
            };

            this.missions.set(mission.id, mission);
            loadedCount++;
            missionIndex++;
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} missions into database!`);
      console.log('✅ Missions loaded successfully');
    } catch (error) {
      console.error('❌ Error loading missions:', error);
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      console.log('📖 Loading events from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-events.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Events file not found, skipping event loading');
        return;
      }

      console.log('📖 Reading event data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      let currentMissionSet = '';

      for (const line of lines) {
        // Check if this is a mission set header
        if (line.startsWith('## ')) {
          currentMissionSet = line.replace('## ', '').trim();
          continue;
        }

        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Name')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 5) { // Split by | creates 5+ elements for 4 columns
            const event: Event = {
              id: `event_${this.nextEventId++}`,
              name: columns[1],
              mission_set: currentMissionSet,
              game_effect: columns[3],
              flavor_text: columns[4],
              image: this.getEventImage(currentMissionSet, columns[1])
            };

            this.events.set(event.id, event);
            loadedCount++;
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} events into database!`);
      console.log('✅ Events loaded successfully');
    } catch (error) {
      console.error('❌ Error loading events:', error);
    }
  }

  private async loadAspects(): Promise<void> {
    try {
      console.log('📖 Loading aspects from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-aspects.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Aspects file not found, skipping aspects loading');
        return;
      }

      console.log('📖 Reading aspects data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      const totalLines = lines.length;
      
      for (const line of lines) {
        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Card Name')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 6) { // Split by | creates 6 elements for 5 columns
            const cardEffect = columns[4] || '';
            const isFortification = cardEffect.includes('**Fortifications!**');
            const isOnePerDeck = cardEffect.includes('**One Per Deck**');
            
            const aspect: Aspect = {
              id: `aspect_${this.nextAspectId++}`,
              card_name: columns[1],
              card_type: columns[2],
              location: columns[3],
              card_effect: cardEffect,
              image: this.getAspectImage(columns[1]),
              is_fortification: isFortification,
              is_one_per_deck: isOnePerDeck
            };

            this.aspects.set(aspect.id, aspect);
            loadedCount++;

            if (loadedCount % 5 === 0) {
              console.log(`   Loaded ${loadedCount}/${totalLines} aspects...`);
            }
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} aspects into database!`);
      console.log('✅ Aspects loaded successfully');
    } catch (error) {
      console.error('❌ Error loading aspects:', error);
    }
  }

  private async loadAdvancedUniverse(): Promise<void> {
    try {
      console.log('📖 Loading advanced universe from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-advanced-universe.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Advanced universe file not found, skipping advanced universe loading');
        return;
      }

      console.log('📖 Reading advanced universe data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      let currentCharacter = '';

      for (const line of lines) {
        // Check if this is a character header
        if (line.startsWith('## ')) {
          currentCharacter = line.replace('## ', '').trim();
          continue;
        }

        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Card Name')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 5) { // Split by | creates 5+ elements for 4 columns
            const cardEffect = columns[4] || '';
            const isOnePerDeck = cardEffect.includes('**One Per Deck**');
            
            const advancedUniverse: AdvancedUniverse = {
              id: `advanced_universe_${this.nextAdvancedUniverseId++}`,
              name: columns[1],
              card_type: columns[2],
              character: currentCharacter,
              card_effect: cardEffect,
              image: this.getAdvancedUniverseImage(columns[1]),
              is_one_per_deck: isOnePerDeck
            };

            this.advancedUniverse.set(advancedUniverse.id, advancedUniverse);
            loadedCount++;
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} advanced universe cards into database!`);
      console.log('✅ Advanced universe loaded successfully');
    } catch (error) {
      console.error('❌ Error loading advanced universe:', error);
    }
  }

  private async loadTeamwork(): Promise<void> {
    try {
      console.log('📖 Loading teamwork from file...');
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-universe-teamwork.md');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ Teamwork file not found, skipping teamwork loading');
        return;
      }

      console.log('📖 Reading teamwork data from file...');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

      let loadedCount = 0;
      const totalLines = lines.length;

      for (const line of lines) {
        // Skip header and separator lines
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Card Type')) {
          const columns = line.split('|').map(col => col.trim());
          
          if (columns.length >= 7) { // Split by | creates 7+ elements for 6 columns
            const teamwork: Teamwork = {
              id: `teamwork_${this.nextTeamworkId++}`,
              card_type: columns[1],
              to_use: columns[2],
              acts_as: columns[3],
              followup_attack_types: columns[4],
              first_attack_bonus: columns[5],
              second_attack_bonus: columns[6],
              image: this.getTeamworkImage(columns[2], columns[4], columns[5], columns[6]) // Use the "To Use" field to determine image
            };

            this.teamwork.set(teamwork.id, teamwork);
            loadedCount++;

            if (loadedCount % 5 === 0) {
              console.log(`   Loaded ${loadedCount}/${totalLines} teamwork cards...`);
            }
          }
        }
      }

      console.log(`🎉 Successfully loaded ${loadedCount} teamwork cards into database!`);
      console.log('✅ Teamwork loaded successfully');
    } catch (error) {
      console.error('❌ Error loading teamwork:', error);
    }
  }

  private async loadAllyUniverse(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-universe-ally.md');
      if (!fs.existsSync(filePath)) {
        console.log('❌ Ally Universe file not found, skipping');
        return;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('---') && !line.includes('Card Name')) {
          const cols = line.split('|').map(c => c.trim());
          if (cols.length >= 8) {
            const cardName = cols[1];
            const ally: AllyUniverse = {
              id: `ally_${this.nextAllyUniverseId++}`,
              card_name: cardName,
              card_type: cols[2],
              stat_to_use: cols[3],
              stat_type_to_use: cols[4],
              attack_value: cols[5],
              attack_type: cols[6],
              card_text: cols[7],
              image: this.getAllyUniverseImage(cardName, cols[4], cols[3])
            };
            this.allyUniverse.set(ally.id, ally);
          }
        }
      }
      console.log(`✅ Loaded ${this.allyUniverse.size} Ally Universe cards`);
    } catch (e) {
      console.error('Error loading Ally Universe:', e);
    }
  }

  private async loadTraining(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-training.md');
      if (!fs.existsSync(filePath)) {
        console.log('❌ Training file not found, skipping');
        return;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('---') && !line.includes('Card Name')) {
          const cols = line.split('|').map(c => c.trim());
          if (cols.length >= 6) {
            const name = cols[1];
            const type1 = cols[2];
            const type2 = cols[3];
            const training: TrainingCard = {
              id: `training_${this.nextTrainingId++}`,
              card_name: name,
              type_1: type1,
              type_2: type2,
              value_to_use: cols[4],
              bonus: cols[5],
              image: this.getTrainingImage(type1, type2)
            };
            this.trainings.set(training.id, training);
          }
        }
      }
      console.log(`✅ Loaded ${this.trainings.size} Training cards`);
    } catch (e) {
      console.error('Error loading Training:', e);
    }
  }

  private async loadBasicUniverse(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-universe-basic.md');
      if (!fs.existsSync(filePath)) {
        console.log('❌ Basic Universe file not found, skipping');
        return;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('---') && !line.includes('Card Name')) {
          const cols = line.split('|').map(c => c.trim());
          if (cols.length >= 5) {
            const name = cols[1];
            const type = cols[2];
            const valueToUse = cols[3];
            const bonus = cols[4];
            const basicUniverse: BasicUniverse = {
              id: `basic_${this.nextBasicUniverseId++}`,
              card_name: name,
              type: type,
              value_to_use: valueToUse,
              bonus: bonus,
              image: this.getBasicUniverseImage(valueToUse, type, bonus)
            };
            this.basicUniverse.set(basicUniverse.id, basicUniverse);
          }
        }
      }
      console.log(`✅ Loaded ${this.basicUniverse.size} Basic Universe cards`);
    } catch (e) {
      console.error('Error loading Basic Universe:', e);
    }
  }

  private async loadPowerCards(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
      if (!fs.existsSync(filePath)) {
        console.log('❌ Power cards file not found, skipping');
        return;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      let currentType: string | null = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and table separators
        if (trimmed === '' || trimmed === '|----------|-----|') continue;
        
        // Check for section headers
        if (trimmed.startsWith('## ')) {
          currentType = trimmed.replace('## ', '').trim();
          continue;
        }
        
        // Skip table headers
        if (trimmed.includes('Power Type') || trimmed.includes('|--')) continue;
        
        // Parse table rows
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean);
          if (cols.length >= 2 && currentType && !isNaN(parseInt(cols[1]))) {
            const powerType = cols[0];
            const value = parseInt(cols[1]);
            
            if (powerType && value && !isNaN(value)) {
              const alternateImages = this.getPowerCardAlternateImages(powerType, value);
              if (alternateImages.length > 0) {
                console.log(`🔍 Power card ${powerType} ${value} has ${alternateImages.length} alternate images:`, alternateImages);
              }
              const card: PowerCard = {
                id: `power_${this.nextPowerCardId++}`,
                power_type: powerType,
                value: value,
                image: this.getPowerCardImage(powerType, value),
                ...(alternateImages.length > 0 && { alternateImages })
              };
              this.powerCards.set(card.id, card);
            }
          }
        }
      }
      console.log(`✅ Loaded ${this.powerCards.size} power cards`);
    } catch (e) {
      console.error('Error loading power cards:', e);
    }
  }

  // Helper methods for image mapping
  private getMissionImage(missionSet: string, cardName: string, index: number): string {
    // Convert mission set and card name to snake_case for matching
    const missionSetSnake = this.convertToSnakeCase(missionSet);
    const cardNameSnake = this.convertToSnakeCase(cardName);
    
    // Map mission set names to their directory names
    const missionSetMapping: { [key: string]: string } = {
      'The Call of Cthulhu': 'the-call-of-cthulhu',
      'King of the Jungle': 'king-of-the-jungle',
      'The Warlord of Mars': 'the-warlord-of-mars',
      'Time Wars: Rise of the Gods': 'time-wars-rise-of-the-gods'
    };
    
    // Get the mapped directory name for this mission set
    const directoryName = missionSetMapping[missionSet];
    if (!directoryName) {
      return 'missions/unknown_mission.webp';
    }
    
    // Return the new path format
    return `missions/${directoryName}/${cardNameSnake}.webp`;
  }

  private getAvailableMissionImages(): string[] {
    // Return a list of available mission image files based on new directory structure
    return [
      // King of the Jungle missions
      "missions/king-of-the-jungle/beasts_of_tarzan.webp",
      "missions/king-of-the-jungle/tarzan_and_the_castaways.webp",
      "missions/king-of-the-jungle/tarzan_and_the_city_of_gold.webp",
      "missions/king-of-the-jungle/tarzan_and_the_golden_lion.webp",
      "missions/king-of-the-jungle/tarzan_at_the_earths_core.webp",
      "missions/king-of-the-jungle/tarzan_of_the_apes.webp",
      "missions/king-of-the-jungle/tarzans_quest.webp",
      
      // The Call of Cthulhu missions
      "missions/the-call-of-cthulhu/gone_too_far.webp",
      "missions/the-call-of-cthulhu/johansens_widow.webp",
      "missions/the-call-of-cthulhu/new_orleans_1908.webp",
      "missions/the-call-of-cthulhu/professor_angells_investigation.webp",
      "missions/the-call-of-cthulhu/the_alert.webp",
      "missions/the-call-of-cthulhu/the_dreams_of_men.webp",
      "missions/the-call-of-cthulhu/worshipping_the_great_old_one.webp",
      
      // The Warlord of Mars missions
      "missions/the-warlord-of-mars/a_fighting_man_of_mars.webp",
      "missions/the-warlord-of-mars/swords_of_mars.webp",
      "missions/the-warlord-of-mars/the_battle_of_kings.webp",
      "missions/the-warlord-of-mars/the_face_of_death.webp",
      "missions/the-warlord-of-mars/the_invisible_men.webp",
      "missions/the-warlord-of-mars/the_loyalty_of_woola.webp",
      "missions/the-warlord-of-mars/under_the_moons_of_mars.webp",
      
      // Time Wars: Rise of the Gods missions
      "missions/time-wars-rise-of-the-gods/battle_at_olympus.webp",
      "missions/time-wars-rise-of-the-gods/divine_retribution.webp",
      "missions/time-wars-rise-of-the-gods/supernatural_allies.webp",
      "missions/time-wars-rise-of-the-gods/the_gods_return.webp",
      "missions/time-wars-rise-of-the-gods/tide_begins_to_turn.webp",
      "missions/time-wars-rise-of-the-gods/travelers_warning.webp",
      "missions/time-wars-rise-of-the-gods/warriors_from_across_time.webp"
    ];
  }

  private getEventImage(missionSet: string, eventName: string): string {
    // Map mission set names to their directory names
    const missionSetMapping: { [key: string]: string } = {
      'The Call of Cthulhu': 'the-call-of-cthulhu',
      'King of the Jungle': 'king-of-the-jungle',
      'The Warlord of Mars': 'the-warlord-of-mars',
      'Time Wars: Rise of the Gods': 'time-wars-rise-of-the-gods'
    };
    
    // Get the mapped image prefix for this mission set
    const imagePrefix = missionSetMapping[missionSet];
    if (!imagePrefix) {
      return 'unknown_event.webp';
    }
    
    // Convert event name to snake_case for matching
    const eventNameSnake = this.convertToSnakeCase(eventName);
    
    // Look for the event image that comes after the mission set images
    const availableImages = this.getAvailableEventImages();
    
    // First try exact matching
    for (const imageFile of availableImages) {
      const imageName = imageFile.replace(/\.(webp|jpg)$/, '');
      
      // Check if this image matches the event name
      if (imageName.includes(eventNameSnake)) {
        return imageFile;
      }
    }
    
    // Try partial word matching for cases like "The Giant Man of Mars" vs "giant_man_of_mars"
    const words = eventNameSnake.split('_').filter(word => word.length > 2);
    for (const imageFile of availableImages) {
      const imageName = imageFile.replace(/\.(webp|jpg)$/, '');
      
      // Check if most words match (at least 70% of words)
      const matchingWords = words.filter(word =>
        imageName.includes(word)
      );
      
      if (matchingWords.length >= words.length * 0.7) {
        return imageFile;
      }
    }
    
    // Try fuzzy matching for similar names
    for (const imageFile of availableImages) {
      const imageName = imageFile.replace(/\.(webp|jpg)$/, '');
      if (this.levenshteinDistance(eventNameSnake, imageName) <= 3) {
        return imageFile;
      }
    }
    
    // Fallback to unknown image
    return 'unknown_event.webp';
  }

  private getAvailableEventImages(): string[] {
    // Return a list of available event image files
    // These come after the mission set images
    return [
      // Call of Cthulhu events (after 356_call_of_cthulu_7.webp)
      "events/357_a_desperate_gamble.webp", "events/358_the_cost_of_knowledge_is_sanity.webp", "events/359_stars_align.webp",
      "events/who_can_you_trust.jpg", "events/healed_by_a_dark_power.jpg",
      // King of the Jungle events (after 368_tarzan_king_of_the_jungle_7.webp)
      "events/369_the_lost_city_of_opar.webp", "events/370_tarzan_the_terrible.webp", "events/371_the_power_of_gonfal.webp",
      // Chronicles of Mars events (after 380_chronicles_of_mars_7.webp)
      "events/381_giant_man_of_mars.webp", "events/382_the_battle_with_zod.webp", "events/383_eyes_in_the_dark.webp",
      // Time Wars: Rise of the Gods events (after 392_world_legends_7.webp)
      "events/393_rally_our_allies.webp", "events/394_second_chances.webp", "events/395_heroes_we_need.webp"
    ];
  }

  private getAspectImage(cardName: string): string {
    // Direct mapping for aspect cards based on their specific names
    const aspectImageMap: { [key: string]: string } = {
      'Amaru: Dragon Legend': 'aspects/434_amaru_dragon_legend.webp',
      'Mallku': 'aspects/435_mallku.webp',
      'Supay': 'aspects/436_supay.webp',
      'Cheshire Cat': 'aspects/437_cheshire_cat.webp',
      'Isis': 'aspects/438_isis.webp'
    };
    
    // Check if we have a direct match
    if (aspectImageMap[cardName]) {
      return aspectImageMap[cardName];
    }
    
    // Fallback to fuzzy matching if no direct match
    const cardNameSnake = this.convertToSnakeCase(cardName);
    const availableImages = this.getAvailableAspectImages();
    
    // Try partial word matching
    const words = cardNameSnake.split('_').filter(word => word.length > 2);
    for (const imageFile of availableImages) {
      const imageName = imageFile.replace('.webp', '');
      const matchingWords = words.filter(word => imageName.includes(word));
      if (matchingWords.length >= words.length * 0.7) {
        return imageFile;
      }
    }
    
    // Try fuzzy matching
    for (const imageFile of availableImages) {
      const imageName = imageFile.replace('.webp', '');
      if (this.levenshteinDistance(cardNameSnake, imageName) <= 3) {
        return imageFile;
      }
    }
    
    return 'unknown_aspect.webp';
  }

  private getAvailableAspectImages(): string[] {
    // Return a list of available aspect image files (IDs 434-438)
    return [
      "specials/434_aspect_1.webp", "specials/435_aspect_2.webp", "specials/436_aspect_3.webp", 
      "specials/437_aspect_4.webp", "specials/438_aspect_5.webp"
    ];
  }

  private getAdvancedUniverseImage(cardName: string): string {
    // Direct mapping for advanced universe cards based on their specific names
    const advancedUniverseImageMap: { [key: string]: string } = {
      'Shards of the Staff': 'advanced-universe/192_shards_of_the_staff.webp',
      'Staff Fragments': 'advanced-universe/193_staff_fragments.webp',
      'Staff Head': 'advanced-universe/194_staff_head.webp'
    };
    
    // Check if we have a direct match
    if (advancedUniverseImageMap[cardName]) {
      return advancedUniverseImageMap[cardName];
    }
    
    return 'unknown_advanced_universe.webp';
  }

  private getTeamworkImage(toUse: string, followupAttackTypes: string, firstAttackBonus: string, secondAttackBonus: string): string {
    // Direct mapping for teamwork cards based on their specific requirements and bonus types
    // This ensures each teamwork card gets its exact corresponding image
    
    // Create a unique key for each teamwork card
    const cardKey = `${toUse}_${followupAttackTypes}_${firstAttackBonus}_${secondAttackBonus}`;
    
    // Direct mapping to the actual image files you provided
    const teamworkImageMap: { [key: string]: string } = {
      // 6 Energy cards - UPDATED BONUSES
      '6 Energy_Combat + Intelligence_0_+1': 'teamwork-universe/398_6_energy_0c_1bf.webp',
      '6 Energy_Brute Force + Combat_0_+1': 'teamwork-universe/399_6_energy_0c_1i.webp',
      '6 Energy_Brute Force + Intelligence_0_+1': 'teamwork-universe/400_6_energy_0b_1i.webp',
      
      // 7 Energy cards - UPDATED BONUSES
      '7 Energy_Combat + Intelligence_+1_+1': 'teamwork-universe/401_7_energy_1c_1bf.webp',
      '7 Energy_Brute Force + Combat_+1_+1': 'teamwork-universe/402_7_energy_1c_1i.webp',
      '7 Energy_Brute Force + Intelligence_+1_+1': 'teamwork-universe/403_7_energy_1bf_1i.webp',
      
      // 8 Energy cards
      '8 Energy_Intelligence + Brute Force_+1_+2': 'teamwork-universe/404_8_energy_1c_2bf.webp',
      '8 Energy_Brute Force + Combat_+1_+2': 'teamwork-universe/405_8_energy_1c_2i.webp',
      '8 Energy_Brute Force + Intelligence_+1_+2': 'teamwork-universe/406_8_energy_1bf_2i.webp',
      
      // 6 Combat cards - UPDATED BONUSES
      '6 Combat_Energy + Intelligence_0_+1': 'teamwork-universe/407_6_combat_0e_1bf.webp',
      '6 Combat_Brute Force + Energy_0_+1': 'teamwork-universe/408_6_combat_0e_1i.webp',
      '6 Combat_Brute Force + Intelligence_0_+1': 'teamwork-universe/409_6_combat_0bf_1i.webp',
      
      // 7 Combat cards - UPDATED BONUSES
      '7 Combat_Energy + Intelligence_+1_+1': 'teamwork-universe/410_7_combat_1e_1bf.webp',
      '7 Combat_Brute Force + Energy_+1_+1': 'teamwork-universe/411_7_combat_1e_1i.webp',
      '7 Combat_Brute Force + Intelligence_+1_+1': 'teamwork-universe/412_7_combat_1bf_1i.webp',
      
      // 8 Combat cards
      '8 Combat_Energy + Intelligence_+1_+2': 'teamwork-universe/413_8_combat_1e_2bf.webp',
      '8 Combat_Brute Force + Energy_+1_+2': 'teamwork-universe/414_8_combat_1e_2i.webp',
      '8 Combat_Brute Force + Intelligence_+1_+2': 'teamwork-universe/415_8_combat_1bf_2i.webp',
      
      // 6 Brute Force cards - UPDATED BONUSES
      '6 Brute Force_Energy + Combat_0_+1': 'teamwork-universe/416_6_brute_force_0e_1c.webp',
      '6 Brute Force_Intelligence + Energy_0_+1': 'teamwork-universe/417_6_brute_force_0e_1i.webp',
      '6 Brute Force_Intelligence + Combat_0_+1': 'teamwork-universe/418_6_brute_force_0c_1i.webp',
      
      // 7 Brute Force cards - UPDATED BONUSES
      '7 Brute Force_Energy + Combat_+1_+1': 'teamwork-universe/419_7_brute_force_1e_1c.webp',
      '7 Brute Force_Intelligence + Energy_+1_+1': 'teamwork-universe/420_7_brute_force_1e_1i.webp',
      '7 Brute Force_Intelligence + Combat_+1_+1': 'teamwork-universe/421_7_brute_force_1c_1i.webp',
      
      // 8 Brute Force cards
      '8 Brute Force_Energy + Combat_+1_+2': 'teamwork-universe/422_8_brute_force_1e_2c.webp',
      '8 Brute Force_Intelligence + Energy_+1_+2': 'teamwork-universe/423_8_brute_force_1e_2i.webp',
      '8 Brute Force_Intelligence + Combat_+1_+2': 'teamwork-universe/424_8_brute_force_1e_2c.webp',
      
      // 6 Intelligence cards - UPDATED BONUSES
      '6 Intelligence_Brute Force + Combat_0_+1': 'teamwork-universe/425_6_intelligence_0e_1c.webp',
      '6 Intelligence_Brute Force + Energy_0_+1': 'teamwork-universe/426_6_intelligence_0e_1bf.webp',
      '6 Intelligence_Combat + Energy_0_+1': 'teamwork-universe/427_6_intelligence_0c_1bf.webp',
      
      // 7 Intelligence cards - UPDATED BONUSES
      '7 Intelligence_Brute Force + Combat_+1_+1': 'teamwork-universe/428_7_intelligence_1e_1c.webp',
      '7 Intelligence_Brute Force + Energy_+1_+1': 'teamwork-universe/429_7_intelligence_1e_1bf.webp',
      '7 Intelligence_Combat + Energy_+1_+1': 'teamwork-universe/430_7_intelligence_1c_1bf.webp',
      
      // 8 Intelligence cards
      '8 Intelligence_Brute Force + Combat_+1_+2': 'teamwork-universe/431_8_intelligence_1e_2c.webp',
      '8 Intelligence_Brute Force + Energy_+1_+2': 'teamwork-universe/432_8_intelligence_1e_2bf.webp',
      '8 Intelligence_Combat + Energy_+1_+2': 'teamwork-universe/433_8_intelligence_1c_2bf.webp',
      
      // Any-Power cards
      '6 Any-Power_Any-Power / Any-Power_0_0': 'teamwork-universe/480_6_anypower.webp',
      '7 Any-Power_Any-Power_0_+1': 'teamwork-universe/481_7_anypower.webp'
    };
    
    // Debug logging
    console.log(`🔍 Looking for teamwork image: ${cardKey}`);
    
    // Check if we have a direct match
    if (teamworkImageMap[cardKey]) {
      console.log(`✅ Direct match found: ${teamworkImageMap[cardKey]}`);
      return teamworkImageMap[cardKey];
    }
    
    console.log(`❌ No direct match found for: ${cardKey}`);
    console.log(`📋 Available keys: ${Object.keys(teamworkImageMap).join(', ')}`);
    
    // Fallback to the old logic if no direct match
    return this.getTeamworkImageFallback(toUse, followupAttackTypes, firstAttackBonus, secondAttackBonus);
  }
  
  private getTeamworkImageFallback(toUse: string, followupAttackTypes: string, firstAttackBonus: string, secondAttackBonus: string): string {
    // Parse the "To Use" field to get level and type
    const parts = toUse.split(' ');
    if (parts.length < 2) return 'unknown_teamwork.webp';
    
    const level = parts[0];
    const statType = parts[1].toLowerCase();
    
    // Map stat types to match the image file naming
    const statTypeMapping: { [key: string]: string } = {
      'energy': 'energy',
      'combat': 'combat', 
      'brute force': 'brute_force',
      'intelligence': 'intelligence',
      'any-power': 'anypower'
    };
    
    const mappedStatType = statTypeMapping[statType];
    if (!mappedStatType) return 'unknown_teamwork.webp';
    
    // Get available images and find the best match
    const availableImages = this.getAvailableTeamworkImages();
    
    // Debug logging
    console.log(`🔍 Fallback: Looking for teamwork image: ${toUse} -> ${mappedStatType} (level ${level})`);
    console.log(`📁 Available images: ${availableImages.length} total`);
    
    // First, try to find images that match the level and stat type exactly
    const levelTypeMatches = availableImages.filter(img => {
      const imgName = img.replace('.webp', '');
      const matches = imgName.includes(`_${level}_${mappedStatType}`) || 
                     imgName.includes(`_${level}_${mappedStatType.replace('_', '')}`);
      if (matches) {
        console.log(`✅ Found level/type match: ${img}`);
      }
      return matches;
    });
    
    console.log(`🎯 Level/type matches found: ${levelTypeMatches.length}`);
    
    if (levelTypeMatches.length > 0) {
      // If we have multiple matches, try to find the best one based on bonus types
      if (levelTypeMatches.length > 1) {
        // Parse followup attack types to get bonus type hints
        const bonusTypes = followupAttackTypes.toLowerCase().split(' + ');
        
        // Look for images that contain hints of the bonus types
        for (const img of levelTypeMatches) {
          const imgName = img.toLowerCase();
          let matchScore = 0;
          
          // Check if image name contains hints of the bonus types
          if (bonusTypes.some(type => imgName.includes(type.substring(0, 2)))) {
            matchScore += 1;
          }
          
          // Check if bonus amounts roughly match
          if (firstAttackBonus === '0' && imgName.includes('0')) matchScore += 1;
          if (firstAttackBonus === '+1' && imgName.includes('1')) matchScore += 1;
          if (secondAttackBonus === '0' && imgName.includes('0')) matchScore += 1;
          if (secondAttackBonus === '+1' && imgName.includes('1')) matchScore += 1;
          if (secondAttackBonus === '+2' && imgName.includes('2')) matchScore += 1;
          
          // If we found a good match, return it
          if (matchScore >= 2) {
            console.log(`🏆 Best match found: ${img} (score: ${matchScore})`);
            return img;
          }
        }
      }
      
      // Return the first match if no specific bonus matching found
      console.log(`📸 Using first level/type match: ${levelTypeMatches[0]}`);
      return levelTypeMatches[0];
    }
    
    // Fallback: try to find any image with the right stat type
    const statTypeMatches = availableImages.filter(img => 
      img.toLowerCase().includes(mappedStatType.replace('_', ''))
    );
    
    if (statTypeMatches.length > 0) {
      console.log(`🔄 Using stat type fallback: ${statTypeMatches[0]}`);
      return statTypeMatches[0];
    }
    
    console.log(`❌ No match found, using unknown placeholder`);
    return 'unknown_teamwork.webp';
  }

  private getAvailableTeamworkImages(): string[] {
    // Return a list of available teamwork image files
    // These are the Power cards from the image list you provided
    return [
      // Energy: 398-406
      "teamwork-universe/398_6_energy_0c_1bf.webp", "teamwork-universe/399_6_energy_0c_1i.webp", "teamwork-universe/400_6_energy_0b_1i.webp",
      "teamwork-universe/401_7_energy_1c_1bf.webp", "teamwork-universe/402_7_energy_1c_1i.webp", "teamwork-universe/403_7_energy_1bf_1i.webp",
      "teamwork-universe/404_8_energy_1c_2bf.webp", "teamwork-universe/405_8_energy_1c_2i.webp", "teamwork-universe/406_8_energy_1bf_2i.webp",
      
      // Combat: 407-415
      "teamwork-universe/407_6_combat_0e_1bf.webp", "teamwork-universe/408_6_combat_0e_1i.webp", "teamwork-universe/409_6_combat_0bf_1i.webp",
      "teamwork-universe/410_7_combat_1e_1bf.webp", "teamwork-universe/411_7_combat_1e_1i.webp", "teamwork-universe/412_7_combat_1bf_1i.webp",
      "teamwork-universe/413_8_combat_1e_2bf.webp", "teamwork-universe/414_8_combat_1e_2i.webp", "teamwork-universe/415_8_combat_1bf_2i.webp",
      
      // Brute Force: 416-424
      "teamwork-universe/416_6_brute_force_0e_1c.webp", "teamwork-universe/417_6_brute_force_0e_1i.webp", "teamwork-universe/418_6_brute_force_0c_1i.webp",
      "teamwork-universe/419_7_brute_force_1e_1c.webp", "teamwork-universe/420_7_brute_force_1e_1i.webp", "teamwork-universe/421_7_brute_force_1c_1i.webp",
      "teamwork-universe/422_8_brute_force_1e_2c.webp", "teamwork-universe/423_8_brute_force_1e_2i.webp", "teamwork-universe/424_8_brute_force_1e_2c.webp",
      
      // Intelligence: 425-433
      "teamwork-universe/425_6_intelligence_0e_1c.webp", "teamwork-universe/426_6_intelligence_0e_1bf.webp", "teamwork-universe/427_6_intelligence_0c_1bf.webp",
      "teamwork-universe/428_7_intelligence_1e_1c.webp", "teamwork-universe/429_7_intelligence_1e_1bf.webp", "teamwork-universe/430_7_intelligence_1c_1bf.webp",
      "teamwork-universe/431_8_intelligence_1e_2c.webp", "teamwork-universe/432_8_intelligence_1e_2bf.webp", "teamwork-universe/433_8_intelligence_1c_2bf.webp",
      
      // Any-Power: 480, 481
      "teamwork-universe/480_6_anypower.webp", "teamwork-universe/481_7_anypower.webp"
    ];
  }

  private getAllyUniverseImage(cardName: string, statType: string, statToUse: string): string {
    // Try to map by stat first using known base set numbers (e.g., 324-331 shown)
    const baseMap: { [key: string]: string[] } = {
      'Energy': ['power-cards/324_5_energy.webp', 'power-cards/325_7_energy.webp'],
      'Combat': ['power-cards/326_5_combat.webp', 'power-cards/327_7_combat.webp'],
      'Brute Force': ['power-cards/328_5_brute_force.webp', 'power-cards/329_7_brute_force.webp'],
      'Intelligence': ['power-cards/330_5_intelligence.webp', 'power-cards/331_7_intelligence.webp']
    };
    const candidates = baseMap[statType] || [];
    if (candidates.length > 0) {
      const prefersSeven = /7\s*or\s*higher/i.test(statToUse);
      const prefersFive = /5\s*or\s*less/i.test(statToUse);
      if (prefersSeven && candidates[1]) return candidates[1];
      if (prefersFive && candidates[0]) return candidates[0];
      return candidates[0];
    }
    // Fallback unknown
    return 'unknown_ally_universe.webp';
  }

  private getTrainingImage(type1: string, type2: string): string {
    // Map the two stats to one of the six combined 5+5 images (344-349)
    // Build key like 'energy_combat', sorted to match filenames order
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    const a = norm(type1);
    const b = norm(type2);
    const pair = [a, b].sort().join('_');
    const map: { [key: string]: string } = {
      'combat_energy': 'training-universe/344_5_energy_5_combat_4.webp',
      'brute_force_energy': 'training-universe/345_5_energy_5_brute_force_4.webp',
      'energy_intelligence': 'training-universe/346_5_energy_5_intelligence_4.webp',
      'brute_force_combat': 'training-universe/347_5_combat_5_brute_force_4.webp',
      'combat_intelligence': 'training-universe/348_5_combat_5_intelligence_4.webp',
      'brute_force_intelligence': 'training-universe/349_5_brute_force_5_intelligence_4.webp',
      'any_power_any_power': 'training-universe/5_any_power_5_sekhmet.webp'
    };
    return map[pair] || 'unknown_training.webp';
  }

  private getBasicUniverseImage(valueToUse: string, type: string, bonus: string): string {
    // Extract the numeric value and bonus from the strings
    // valueToUse: "6 or greater" -> extract "6"
    // bonus: "+2" -> extract "2"
    const valueMatch = valueToUse.match(/(\d+)/);
    const bonusMatch = bonus.match(/(\d+)/);
    
    if (valueMatch && bonusMatch) {
      const value = valueMatch[1];
      const bonusValue = bonusMatch[1];
      const typeLower = type.toLowerCase().replace(/\s+/g, '_');
      
      // Map to the correct image IDs based on the pattern
      // Format: [ID]_[valueToUse]_[type]_[bonus].webp
      const imageMap: { [key: string]: string } = {
        // Energy cards
        '6_energy_2': 'basic-universe/332_6_energy_2.webp',  // Ray Gun
        '6_energy_3': 'basic-universe/333_6_energy_3.webp',  // Merlin's Wand
        '7_energy_3': 'basic-universe/334_7_energy_3.webp',  // Lightning Bolt
        
        // Combat cards
        '6_combat_2': 'basic-universe/335_6_combat_2.webp',  // Flintlock
        '6_combat_3': 'basic-universe/336_6_combat_3.webp',  // Rapier
        '7_combat_3': 'basic-universe/337_7_combat_3.webp',  // Longbow
        
        // Brute Force cards
        '6_brute_force_2': 'basic-universe/338_6_brute_force_2.webp',  // Hyde's Serum
        '6_brute_force_3': 'basic-universe/339_6_brute_force_3.webp',  // Trident
        '7_brute_force_3': 'basic-universe/340_7_brute_force_3.webp',  // Tribuchet
        
        // Intelligence cards
        '6_intelligence_2': 'basic-universe/341_6_intelligence_2.webp',  // Secret Identity
        '6_intelligence_3': 'basic-universe/342_6_intelligence_3.webp',  // Advanced Technology
        '7_intelligence_3': 'basic-universe/343_7_intelligence_3.webp'   // Magic Spell
      };
      
      const key = `${value}_${typeLower}_${bonusValue}`;
      return imageMap[key] || 'unknown_basic_universe.webp';
    }
    
    return 'unknown_basic_universe.webp';
  }

  private getPowerCardImage(powerType: string, value: number): string {
    const type = powerType.toLowerCase().replace(/\s+/g, '_');
    if (type === 'any-power' || type === 'any_power') {
      if (value === 5) return 'power-cards/473_5_any-power.webp';
      if (value === 6) return 'power-cards/474_6_anypower.webp';
      if (value === 7) return 'power-cards/475_7_anypower.webp';
      if (value === 8) return 'power-cards/476_8_anypower.webp';
    }
    if (type === 'multi-power' || type === 'multi_power') {
      if (value === 3) return 'power-cards/477_3_multipower.webp';
      if (value === 4) return 'power-cards/478_4_multipower.webp';
      if (value === 5) return 'power-cards/479_5_multipower.webp';
    }
    const baseMap: { [key: string]: number } = {
      energy: 292,
      combat: 300,
      brute_force: 308,
      intelligence: 316
    };
    const base = baseMap[type] || 0;
    if (base > 0 && value >= 1 && value <= 8) {
      const num = base + (8 - value); // images go descending 8..1
      return `power-cards/${num}_${value}_${type}.webp`;
    }
    return 'unknown_power.webp';
  }
}
