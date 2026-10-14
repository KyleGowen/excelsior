import { CATALOG_PRESENTATION_TYPES, presentCatalog } from '../../src/services/catalog-presentation/presentCatalog';
import { presentCatalog as baseline } from '../helpers/baselineCatalogPresentation';
import type { CatalogCard, FoilMapEntry } from '../../src/services/catalog-presentation/types';

describe('indexed printing presentation preserves the deployed contract', () => {
  const foils: FoilMapEntry[] = [
    { baseCardId: 'base', foilCardId: 'foil', cardType: 'power' },
    { baseCardId: 'base', foilCardId: 'promo', cardType: 'power' },
    { baseCardId: 'missing-base', foilCardId: 'orphan', cardType: 'power' },
    { baseCardId: 'missing-foil', foilCardId: 'not-in-catalog', cardType: 'power' },
  ];
  const base = { name: 'Shared Name', character: 'Angry Mob', card_name: 'Shared Name',
    power_type: 'Combat', value: 7, stat_to_use: '6', stat_type_to_use: 'Energy',
    type: 'Energy', type_1: 'Energy', type_2: 'Combat', value_to_use: '6', bonus: '2',
    to_use: '6 Combat', acts_as: '6 Combat', followup_attack_types: 'Energy + Intelligence',
    mission_set: 'Fixture', set: 'SKY', set_number: '10', image: 'normal.jpg' };
  const rows: CatalogCard[] = [
    { ...base, id: 'alt', set_number: '1', image: 'alternate/card.jpg' },
    { ...base, id: 'base' },
    { ...base, id: 'tied' },
    { ...base, id: 'foil', is_foil: true, set_number: '10F' },
    { ...base, id: 'promo', is_foil: true, set: 'TFCP', set_number: '1F' },
    { ...base, id: 'orphan', is_foil: true, set: 'SKYP', set_number: '11F' },
    { ...base, id: 'missing-foil', name: 'Different', card_name: 'Different', set_number_foil: '12F' },
    { id: 'blank', name: '', card_name: '' },
  ];
  const characters = [{ id: 'mob', name: 'Angry Mob (Farmers)' }];
  it.each(CATALOG_PRESENTATION_TYPES)('matches every field/order for %s, including reordered input', type => {
    for (const cards of [rows, [...rows].reverse(), rows.slice(3), []]) {
      expect(presentCatalog(cards, type, foils, characters)).toEqual(baseline(cards, type, foils, characters));
    }
  });
  it('does not mutate source rows, foil maps, or linked characters', () => {
    const input = structuredClone({ rows, foils, characters });
    presentCatalog(rows, 'characters', foils, characters);
    expect({ rows, foils, characters }).toEqual(input);
  });
});
