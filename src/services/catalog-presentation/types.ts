export type CatalogType =
  | 'characters'
  | 'special-cards'
  | 'power-cards'
  | 'locations'
  | 'battlegrounds'
  | 'missions'
  | 'events'
  | 'aspects'
  | 'advanced-universe'
  | 'teamwork'
  | 'ally-universe'
  | 'training'
  | 'basic-universe';


export interface CatalogCard {
  id: string;
  /** Characters/specials/power/missions/events use `name`. */
  name?: string;
  /** Special cards: linked character (`character_name` in DB). */
  character?: string;
  /** Aspects/ally/training/basic-universe use `card_name`. */
  card_name?: string;
  set?: string;
  set_number?: string | null;
  rarity?: string | null;
  image?: string;
  image_path?: string;
  reverse_image_path?: string | null;
  is_foil?: boolean;
  /** Official errata linked to this exact persisted card printing. */
  errata?: unknown[];

  /* Character / stat fields */
  energy?: number;
  combat?: number;
  brute_force?: number;
  intelligence?: number;
  threat_level?: number;
  special_abilities?: string;

  /* Common per-type ability/effect text */
  special_ability?: string;
  card_effect?: string;
  game_effect?: string;
  flavor_text?: string;
  card_text?: string;

  one_per_deck?: boolean;
  is_one_per_deck?: boolean;

  /** Per-type extra fields (e.g. acts_as, to_use, value, icons...). */
  [key: string]: unknown;
}

export interface FoilMapEntry { foilCardId: string; baseCardId: string; cardType: string }
