import { maxCopiesForAddCards } from '../../../src/services/deck-candidates/editorCopyCeiling';
import type { CatalogCard } from '../../../frontend/src/lib/api/types';

const card = (id: string): CatalogCard => ({ id, name: id });

describe('maxCopiesForAddCards', () => {
  it('allows Location and Battleground counts to exceed their legality limits', () => {
    expect(maxCopiesForAddCards(card('homebase'))).toBe(99);
    expect(maxCopiesForAddCards(card('other-location'))).toBe(99);
    expect(maxCopiesForAddCards(card('gda'))).toBe(99);
    expect(maxCopiesForAddCards(card('future-bg'))).toBe(99);
  });

  it('preserves ordinary and one-per-deck copy ceilings', () => {
    expect(maxCopiesForAddCards(card('power'))).toBe(99);
    expect(maxCopiesForAddCards({ ...card('special'), one_per_deck: true })).toBe(1);
  });
});
