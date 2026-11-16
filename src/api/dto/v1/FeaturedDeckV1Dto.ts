import type { DeckCard } from '../../../types';
import type { AccountDeckLibraryDto } from './AccountDeckLibraryDto';

export interface FeaturedDeckV1Dto extends AccountDeckLibraryDto {
  deckCards: Array<Pick<DeckCard, 'type' | 'cardId' | 'quantity'> & { exclude_from_draw: boolean }>;
}
