import { matchDeckSearch, normalizeDeckSearch } from '../../../frontend/src/features/deck-selection/matchDeckSearch';

describe('personal deck search', () => {
  const match = (name: string, cardNames: string[], text: string) =>
    matchDeckSearch({ name, cardNames }, normalizeDeckSearch(text));

  it('matches whole card phrases with flexible case and separators', () => {
    expect(match('Paris at Dawn', ['War Woman', 'The Three Musketeers'], ' WAR-woman ').cards)
      .toEqual(['War Woman']);
    expect(match('Paris at Dawn', ['The Three Musketeers'], 'musKeteers').matches).toBe(true);
  });

  it('matches the start of a card-name word or phrase', () => {
    expect(match('The Resistance', ['Dr. Watson', 'Dracula'], 'Wats').cards).toEqual(['Dr. Watson']);
    expect(match('The Resistance', ['Dr. Watson'], 'dr wats').cards).toEqual(['Dr. Watson']);
    expect(match('The Resistance', ['Dr. Watson'], 'atson').matches).toBe(false);
  });

  it('matches Ra without matching embedded letters or joining different cards', () => {
    expect(match('Training room', ['Dracula', 'Korak', 'Time Traveler'], 'Ra').matches).toBe(false);
    expect(match('Desert Patrol', ['Ra', 'Time Traveler'], 'Ra').cards).toEqual(['Ra']);
    expect(match('Draft', ['War', 'Woman'], 'War Woman').matches).toBe(false);
  });

  it('supports partial deck titles and shows all decks when cleared', () => {
    expect(match('Time Detectives', [], 'time det')).toEqual({ matches: true, cards: [] });
    expect(match('Empty Deck', [], ' ')).toEqual({ matches: true, cards: [] });
    expect(match('Empty Deck', [], 'musketeers').matches).toBe(false);
  });
});
