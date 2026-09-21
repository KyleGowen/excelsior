import type { CatalogCard } from '../../frontend/src/lib/api/types';
import { compareDbvCatalogCards } from '../../frontend/src/lib/catalog/catalogTypeMap';

function card(partial: Partial<CatalogCard> & { id: string }): CatalogCard {
  return partial as CatalogCard;
}

describe('compareDbvCatalogCards', () => {
  describe('default tabs (e.g. characters)', () => {
    it('sorts characters alphabetically by name', () => {
      const unsorted: CatalogCard[] = [
        card({ id: 'c3', name: 'Charlie', set: 'ERB', set_number: '3' }),
        card({ id: 'c1', name: 'Alpha', set: 'ERB', set_number: '1' }),
        card({ id: 'c2', name: 'Bravo', set: 'SKY', set_number: '1' }),
        card({ id: 'c4', name: 'Delta', set: 'ERB', set_number: '2' }),
      ];

      const sorted = [...unsorted].sort((a, b) => compareDbvCatalogCards(a, b, 'characters'));

      expect(sorted.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4']);
    });

    it('sorts leading-The character names by the following word', () => {
      const unsorted = [
        card({ id: 'mauler', name: 'Mauler Twins', set: 'SKY', set_number: '58' }),
        card({ id: 'immortal', name: 'The Immortal', set: 'ERB', set_number: '20' }),
        card({ id: 'lancelot', name: 'Lancelot', set: 'ERB', set_number: '18' }),
        card({ id: 'flaxans', name: 'The Flaxans', set: 'SKY', set_number: '50' }),
        card({ id: 'glenn', name: 'Glenn', set: 'SKY', set_number: '15' }),
      ];

      const sorted = [...unsorted].sort((a, b) =>
        compareDbvCatalogCards(a, b, 'characters'),
      );

      expect(sorted.map((c) => c.name)).toEqual([
        'The Flaxans',
        'Glenn',
        'The Immortal',
        'Lancelot',
        'Mauler Twins',
      ]);
    });
  });

  describe('special-cards', () => {
    it('sorts set_number before character name', () => {
      const unsorted: CatalogCard[] = [
        card({
          id: 's2',
          name: 'Special B',
          set: 'ERB',
          set_number: '2',
          character: 'Batman',
        }),
        card({
          id: 's1',
          name: 'Special A',
          set: 'ERB',
          set_number: '1',
          character: 'Superman',
        }),
      ];

      const sorted = [...unsorted].sort((a, b) => compareDbvCatalogCards(a, b, 'special-cards'));

      expect(sorted.map((c) => c.id)).toEqual(['s1', 's2']);
    });

    it('sorts by character after matching set and set_number', () => {
      const unsorted: CatalogCard[] = [
        card({
          id: 's2',
          name: 'Special B',
          set: 'ERB',
          set_number: '1',
          character: 'Superman',
        }),
        card({
          id: 's1',
          name: 'Special A',
          set: 'ERB',
          set_number: '1',
          character: 'Batman',
        }),
      ];

      const sorted = [...unsorted].sort((a, b) => compareDbvCatalogCards(a, b, 'special-cards'));

      expect(sorted.map((c) => c.id)).toEqual(['s1', 's2']);
    });
  });

  describe('power-cards', () => {
    const powerCard = (
      id: string,
      set: string,
      set_number: string,
      power_type: string,
      value: number,
    ): CatalogCard =>
      card({
        id,
        name: `${value} - ${power_type}`,
        set,
        set_number,
        power_type,
        value,
      });

    it('sorts by power type and value regardless of set and set_number', () => {
      const unsorted: CatalogCard[] = [
        powerCard('p2', 'SKY', '1', 'Energy', 1),
        powerCard('p1', 'ERB', '5', 'Combat', 9),
        powerCard('p3', 'ERB', '2', 'Any-Power', 7),
      ];

      const sorted = [...unsorted].sort((a, b) => compareDbvCatalogCards(a, b, 'power-cards'));

      expect(sorted.map((c) => c.id)).toEqual(['p2', 'p1', 'p3']);
    });

    it('preserves power type order within the same set and set_number', () => {
      const unsorted: CatalogCard[] = [
        powerCard('any7', 'ERB', '1', 'Any-Power', 7),
        powerCard('int3', 'ERB', '1', 'Intelligence', 3),
        powerCard('combat2', 'ERB', '1', 'Combat', 2),
        powerCard('energy1', 'ERB', '1', 'Energy', 1),
        powerCard('bf4', 'ERB', '1', 'Brute Force', 4),
        powerCard('mp5', 'ERB', '1', 'Multi-Power', 5),
        powerCard('energy3', 'ERB', '1', 'Energy', 3),
        powerCard('combat6', 'ERB', '1', 'Combat', 6),
      ];

      const sorted = [...unsorted].sort((a, b) => compareDbvCatalogCards(a, b, 'power-cards'));

      expect(sorted.map((c) => c.id)).toEqual([
        'energy1',
        'energy3',
        'combat2',
        'combat6',
        'bf4',
        'int3',
        'mp5',
        'any7',
      ]);
    });
  });
});
