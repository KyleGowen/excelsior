export interface ExportDeckCardsJson {
  characters: string[];
  special_cards: Record<string, string[]>;
  locations: string[];
  battlegrounds: string[];
  missions: Record<string, string[]>;
  events: Record<string, string[]>;
  aspects: string[];
  advanced_universe: Record<string, string[]>;
  teamwork: string[];
  allies: string[];
  training: string[];
  basic_universe: string[];
  power_cards: string[];
}

export interface ExportDeckJsonFull {
  name: string;
  description: string;
  total_cards: number;
  max_energy: number;
  max_combat: number;
  max_brute_force: number;
  max_intelligence: number;
  total_energy_icons: number;
  total_combat_icons: number;
  total_brute_force_icons: number;
  total_intelligence_icons: number;
  total_threat: number;
  legal: boolean;
  limited: boolean;
  export_timestamp: string;
  exported_by: string;
  reserve_character: string | null;
  cataclysm_special: string | null;
  assist_special: string | null;
  ambush_special: string | null;
  cards: ExportDeckCardsJson;
}

export interface DeckExportDto { schemaVersion:1; inputKey:string; revision:number; deck:ExportDeckJsonFull; topDeck:string; }
