/** Shared types for deck JSON import (v2.0 export contract). */

export interface ImportCardEntry {
  name: string;
  type: string;
  followup_attack_types?: string | undefined;
  stat_to_use?: string | null | undefined;
  stat_type_to_use?: string | null | undefined;
  type_1?: string | null | undefined;
  type_2?: string | null | undefined;
  bonus?: string | null | undefined;
  type_field?: string | null | undefined;
  value_to_use?: string | null | undefined;
}

export interface ImportDeckCardsJson {
  characters?: string[] | undefined;
  special_cards?: Record<string, string[]> | undefined;
  locations?: string[] | undefined;
  battlegrounds?: string[] | undefined;
  missions?: Record<string, string[]> | undefined;
  events?: Record<string, string[]> | undefined;
  aspects?: string[] | undefined;
  advanced_universe?: Record<string, string[]> | undefined;
  teamwork?: string[] | undefined;
  allies?: string[] | undefined;
  training?: string[] | undefined;
  basic_universe?: string[] | undefined;
  power_cards?: string[] | undefined;
}

export interface ImportDeckJson {
  name?: string | undefined;
  description?: string | undefined;
  limited?: boolean | undefined;
  reserve_character?: string | null | undefined;
  cards: ImportDeckCardsJson;
}

export interface ResolvedImportCard {
  cardType: string;
  cardId: string;
  quantity: number;
}

export interface ResolveImportCardsResult {
  resolved: ResolvedImportCard[];
  unresolved: ImportCardEntry[];
}

export type ImportCatalogMap = Map<string, Record<string, unknown>>;
