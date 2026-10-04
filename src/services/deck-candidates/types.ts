export interface CharacterStatRow {
  name: string;
  energy: number;
  combat: number;
  brute_force: number;
  intelligence: number;
}

export interface DeckUsabilityContext {
  characterNames: string[];
  characterStats: CharacterStatRow[];
  angryMobCharacterNames: string[];
  missionSets: Set<string>;
  homebaseName: string;
  battlegroundName: string;
  hasGdaAnyCharacterSpecial: boolean;
  hasNonGdaAnyCharacterSpecial: boolean;
  characterCount: number;
}
