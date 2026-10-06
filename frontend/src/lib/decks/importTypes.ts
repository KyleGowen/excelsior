/** Shared types for deck JSON import (v2.0 export contract). */

export interface ImportDeckCardsJson {
  characters?: string[];
  special_cards?: Record<string, string[]>;
  locations?: string[];
  battlegrounds?: string[];
  missions?: Record<string, string[]>;
  events?: Record<string, string[]>;
  aspects?: string[];
  advanced_universe?: Record<string, string[]>;
  teamwork?: string[];
  allies?: string[];
  training?: string[];
  basic_universe?: string[];
  power_cards?: string[];
}

export interface ImportDeckJson {
  name?: string;
  description?: string;
  limited?: boolean;
  reserve_character?: string | null;
  cards: ImportDeckCardsJson;
}
