// Clean, simple database schema

// User roles enum
export type UserRole = 'GUEST' | 'USER' | 'ADMIN';

/** Checklist / DB rarity; NULL allowed (e.g. ERBP promos). Enforced in DB via CHECK on card tables. */
export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare';

// User table
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt?: Date | null;
  /** `'password'` (default) or `'google'` for Firebase/Google SSO. */
  authProvider?: string;
  /**
   * Optional public display name. Primarily used by SSO users (who cannot rename
   * `name`/username). Password users display `name`; for them this stays null.
   * See `resolveUserDisplayName`.
   */
  displayName?: string | null;
}

// Deck table
export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  ui_preferences?: UIPreferences;
  is_limited?: boolean;
  is_valid?: boolean;
  /** Deck visibility. TRUE = private (owner only), FALSE = public. Independent of is_limited/is_valid. */
  is_private?: boolean;
  card_count?: number;
  threat?: number;
  reserve_character?: string; // UUID of the character card that serves as the reserve character
  display_mission_card_id?: string | null; // UUID of the mission card to display on the deck selection tile; NULL falls back to first mission preview.
  background_image_path?: string; // Relative path to background image for deck editor (e.g., src/resources/images/backgrounds/landscape/aesclepnotext.png). NULL means default black background.
  created_at?: string;
  updated_at?: string;
  cards?: DeckCard[];
}

/** Deck-list row plus release metadata for the official preconstructed-deck catalog. */
export interface PreconstructedDeckRecord {
  deck: Deck;
  setCode: string;
  setLabel: string;
  releaseOrder: number;
  deckOrder: number;
}

// Character table (from overpower-erb-characters.md)
export interface Character {
  id: string;
  name: string;
  set?: string; // Optional for backward compatibility (renamed from universe)
  energy: number;
  combat: number;
  brute_force: number;
  intelligence: number;
  threat_level: number;
  special_abilities: string; // Can be empty string for no special ability
  image: string;
  image_path?: string; // Optional for backward compatibility, same as image
  reverse_image_path?: string | null; // Optional second face (Skybound Walkers)
  set_number?: string; // e.g. "035" or "035F" for foil rows
  rarity?: CardRarity | null; // null if unknown / promo not in source
  is_foil?: boolean;   // TRUE for foil card rows; foil effect applied via CSS only
}

export interface Location {
  id: string;
  name: string;
  threat_level: number;
  special_ability: string;
  image: string;
  image_path?: string;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface Battleground {
  id: string;
  name: string;
  special_ability: string;
  image: string;
  image_path?: string;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
  is_foil?: boolean;
}

// Card types for future expansion
export interface Card {
  id: string;
  type: 'character' | 'power' | 'special';
  data: Character | PowerCard | SpecialCard;
}

// (PowerCard defined later with full fields)

// Special card structure (from overpower-erb-specials.md)
export interface SpecialCard {
  id: string;
  name: string;
  card_type: string;
  character: string;
  card_effect: string;
  image: string;
  image_path?: string;  // Database path; image is derived from this
  set?: string;         // Set code (renamed from universe)
  icons?: string[]; // e.g., ["Energy"], ["Combat","Brute Force"], ["Any-Power"]
  value?: number | null; // level associated with icons
  is_cataclysm: boolean;
  is_assist: boolean;
  is_ambush: boolean;
  one_per_deck: boolean;
  icon_offensive_swords?: boolean;
  icon_defensive_shield?: boolean;
  icon_remainder_of_battle?: boolean;
  icon_remainder_of_game?: boolean;
  icon_attached_paperclip?: boolean;
  icon_astral_plane?: boolean;
  icon_first_action_only?: boolean;
  banned?: boolean;     // Indicates if the card is banned from legal deck construction
  set_number?: string;  // e.g. "036F" for foil rows
  rarity?: CardRarity | null;
  is_foil?: boolean;    // TRUE for foil card rows; foil effect applied via CSS only
}

export interface Mission {
  id: string;
  mission_set: string;
  card_name: string;
  image: string;
  image_path?: string;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
  is_foil?: boolean;
}

export interface Event {
  id: string;
  name: string;
  mission_set: string;
  game_effect: string;
  flavor_text: string;
  image: string;
  image_path?: string;
  one_per_deck: boolean;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface Aspect {
  id: string;
  card_name: string;
  card_type: string;
  location: string;
  card_effect: string;
  aspect_description?: string;
  image: string;
  image_path?: string;
  icons?: string[]; // derived from aspect_description when it acts as an attack/defense
  value?: number | null; // level associated with icons, when applicable
  is_fortification: boolean;
  is_one_per_deck: boolean;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface AdvancedUniverse {
  id: string;
  name: string;
  card_type: string;
  character: string;
  card_effect: string;
  card_description?: string;
  image: string;
  image_path?: string;
  is_one_per_deck: boolean;
  icon_offensive_swords?: boolean;
  icon_defensive_shield?: boolean;
  icon_remainder_of_battle?: boolean;
  icon_remainder_of_game?: boolean;
  icon_astral_plane?: boolean;
  icon_first_action_only?: boolean;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface Teamwork {
  id: string;
  name: string;
  card_type: string;
  to_use: string;
  acts_as: string;
  followup_attack_types: string;
  first_attack_bonus: string;
  second_attack_bonus: string;
  image: string;
  image_path?: string;
  one_per_deck: boolean;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface AllyUniverse {
  id: string;
  card_name: string;
  card_type: string;
  stat_to_use: string;          // e.g., "5 or less" or "7 or higher"
  stat_type_to_use: string;     // Energy | Combat | Brute Force | Intelligence
  attack_value: string;         // numeric as string to preserve formatting
  attack_type: string;          // Combat | Brute Force | Intelligence
  card_text: string;
  image: string;
  image_path?: string;
  one_per_deck: boolean;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface TrainingCard {
  id: string;
  card_name: string;
  type_1: string;      // Energy | Combat | Brute Force | Intelligence
  type_2: string;      // Energy | Combat | Brute Force | Intelligence
  value_to_use: string; // e.g., "5 or less"
  bonus: string;        // e.g., "+4"
  image: string;
  image_path?: string;
  one_per_deck: boolean;
  is_foil?: boolean; // Foil-only promo rows pair with base via foil_card_map; hidden from add-card lists
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface BasicUniverse {
  id: string;
  card_name: string;
  type: string;         // Energy | Combat | Brute Force | Intelligence
  value_to_use: string; // e.g., "6 or greater", "7 or greater"
  bonus: string;        // e.g., "+2", "+3"
  image: string;
  image_path?: string;
  one_per_deck: boolean;
  set?: string;
  set_number?: string | null;
  rarity?: CardRarity | null;
}

export interface PowerCard {
  id: string;
  name: string;         // Formatted name like "4 - Brute Force"
  power_type: string;   // Energy | Combat | Brute Force | Intelligence | Any-Power | Multi-Power
  value: number;        // 1..8, or 3..5 for Multi-Power
  image: string;
  image_path?: string; // Database path; image is derived from this
  set?: string;         // Set code (renamed from universe)
  set_name?: string;    // Set display name from sets table
  one_per_deck: boolean; // Whether this card can only be included once per deck
  set_number?: string;  // e.g. "473F" for foil rows
  rarity?: CardRarity | null;
  is_foil?: boolean;    // TRUE for foil card rows; foil effect applied via CSS only
}

/**
 * One entry from the foil_card_map table.
 * The table is bidirectional — both foil→base and base→foil lookups are
 * available by querying the same table in both directions.
 *
 * On the frontend this is flattened into window.foilCardMap: a plain object
 * keyed in both directions for O(1) lookups:
 *   window.foilCardMap[foilCardId]  → baseCardId
 *   window.foilCardMap[baseCardId]  → foilCardId
 */
export interface FoilCardMapEntry {
  foilCardId: string;
  baseCardId: string;
  cardType: string; // 'character' | 'special' | 'power'
}

// Deck management interfaces
export interface DeckCard {
  id: string;
  type: 'character' | 'location' | 'battleground' | 'special' | 'mission' | 'event' | 'aspect' | 'advanced-universe' | 'teamwork' | 'ally-universe' | 'training' | 'basic-universe' | 'power';
  cardId: string; // The ID from the original card table (now includes alternate cards as separate rows)
  quantity: number; // How many copies of this card
  displayOrder?: number; // Stable deck-editor / preview order (zero-based)
  /** Whether one physical copy in this aggregated row is pre-placed and excluded from Draw Hand. */
  exclude_from_draw?: boolean;
  defaultImage?: string; // Preview image path populated when building deck list metadata
  name?: string; // Card name populated when building deck list metadata
  is_foil?: boolean; // TRUE for foil card rows; used by deck tile preview for foil-shimmer
}

// Extended type for API operations that includes special cases
export type CardTypeOrAll = DeckCard['type'] | 'all';

export interface UIPreferences {
  dividerPosition?: number; // Percentage position of the divider (0-100)
  expansionState?: Record<string, boolean>; // Expansion state of deck content categories
  powerCardsSortMode?: 'type' | 'value'; // Sort mode for power cards
  characterGroupExpansionState?: Record<string, boolean>; // Expansion state of character groups
}

export interface DeckMetadata {
  id: string;
  name: string;
  description?: string;
  created: string; // ISO date string
  lastModified: string; // ISO date string
  cardCount: number; // Total number of cards in deck
  userId: string; // Owner of the deck
  uiPreferences?: UIPreferences; // UI state persistence
  /** UUID of reserve character; present on API list/detail metadata when set */
  reserve_character?: string | null;
}

export interface DeckData {
  metadata: DeckMetadata;
  cards: DeckCard[];
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
