import type { EnrichedDeckListItem } from '../../services/communityService';

/** One release-set row in the Community page's official preconstructed-deck catalog. */
export interface PreconstructedDeckGroupV1DataDto {
  setCode: string;
  setName: string;
  decks: EnrichedDeckListItem[];
  /** Curated upgrade decks displayed as a nested row within this release set. */
  featuredUpgradeRecommendations: EnrichedDeckListItem[];
}
