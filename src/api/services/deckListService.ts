import type { Deck } from '../../types';
import { transformDeckList } from '../deckTransform';
import { attachDeckCardNames, type DeckCardNames } from './deckCardNames';
import type { DeckListV1DataDto } from '../dto/v1/DeckListV1DataDto';

export type DeckListOrderBy = 'created_at' | 'updated_at';

export interface DeckListRepository {
  getDecksByUserId: (userId: string, orderBy?: DeckListOrderBy) => Promise<Deck[]>;
  getPublicLegalDecksByUserId: (userId: string, orderBy?: DeckListOrderBy) => Promise<Deck[]>;
}

/**
 * User-scoped deck list reads for v1 (and shared with legacy until fully migrated).
 */
export class DeckListService {
  constructor(private readonly deckRepository: DeckListRepository, private readonly cardNames?: DeckCardNames) {}

  async getTransformedListForUser(userId: string, includeCardNames = false): Promise<DeckListV1DataDto> {
    const decks = await this.deckRepository.getDecksByUserId(userId);
    // Viewer is the owner here ("My Decks"), so isOwner is set on every item.
    const list = transformDeckList(decks, userId);
    return includeCardNames && this.cardNames ? attachDeckCardNames(list, await this.cardNames.forUser(userId)) : list;
  }

  async getTransformedCommunityListForUser(
    userId: string
  ): Promise<ReturnType<typeof transformDeckList>> {
    const decks = await this.deckRepository.getPublicLegalDecksByUserId(userId, 'updated_at');
    return transformDeckList(decks);
  }

  async getTransformedTournamentListForUser(
    userId: string
  ): Promise<ReturnType<typeof transformDeckList>> {
    const decks = await this.deckRepository.getPublicLegalDecksByUserId(userId, 'updated_at');
    return transformDeckList(decks);
  }
}
