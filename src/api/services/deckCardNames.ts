import type { DeckCard } from '../../types';
import type { DeckRepository } from '../../repository/DeckRepository';
import type { DeckValidationService } from '../../services/deckValidationService';
import { cardDisplayName } from '../../services/catalog-presentation/displayFields';
import { deckCardMapKey } from '../../services/deck-validation/deck-validation-utils';

type DeckSearchCard = Pick<DeckCard, 'type' | 'cardId'> & { deckId: string };

export class DeckCardNames {
  constructor(
    private readonly repository: Pick<DeckRepository, 'getDeckCardReferencesByUserId'>,
    private readonly catalog: Pick<DeckValidationService, 'resolveCatalog'>,
  ) {}

  async forUser(userId: string, sessionCards: readonly DeckSearchCard[] = []): Promise<Map<string, string[]>> {
    const savedCards = await this.repository.getDeckCardReferencesByUserId(userId);
    const namesByDeck = new Map<string, Set<string>>();
    if (savedCards.length || sessionCards.length) {
      const catalog = await this.catalog.resolveCatalog();
      for (const card of [...savedCards, ...sessionCards]) {
        const name = cardDisplayName(catalog.get(deckCardMapKey(card)));
        if (!name) continue;
        const names = namesByDeck.get(card.deckId) ?? new Set<string>();
        names.add(name);
        namesByDeck.set(card.deckId, names);
      }
    }
    return new Map(Array.from(namesByDeck, ([id, names]) => [id, Array.from(names).sort()]));
  }
}

export function attachDeckCardNames<T extends { metadata: { id: string } }>(
  decks: T[], namesByDeck: ReadonlyMap<string, string[]>,
) {
  return decks.map(deck => ({
    ...deck,
    metadata: { ...deck.metadata, cardNames: namesByDeck.get(deck.metadata.id) ?? [] },
  }));
}
