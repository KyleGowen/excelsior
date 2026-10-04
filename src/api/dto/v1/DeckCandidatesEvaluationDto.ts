export interface DeckCandidateDecision {
  catalogType: string; cardId: string; usable: boolean;
  reasons: Array<{ code: 'STARTING_TEAM' | 'POWER_GRID' | 'MISSION_SET' | 'HOMEBASE'; message: string }>;
  /** Editor tile ceiling, not server persistence permission or fresh whole-deck legality. */
  maxCopies: number;
}
export interface DeckCandidatesEvaluationDto {
  schemaVersion: 1; revision: number; inputKey: string;
  versions: { catalog: string; rules: string };
  candidates: DeckCandidateDecision[];
  missionLimitReached: boolean;
}
