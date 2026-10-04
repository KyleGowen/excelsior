import { presentCatalog } from '../../../src/services/catalog-presentation/presentCatalog';
import type { CatalogCard, CatalogType } from '../../../frontend/src/lib/api/types';
import { buildFoilCardMapLookup } from '../../../frontend/src/lib/catalog/foilCatalog';
import { prepareAddCardsCatalogList, dedupeToDefaultCatalogCards, resolveDefaultCardForDeckAdd } from '../../../frontend/src/lib/catalog/defaultCatalogCards';
import { collectPrintingsForCard } from '../../../frontend/src/lib/catalog/cardPrintings';
import { cardMatchesSearchQuery } from '../../../frontend/src/lib/catalog/catalogTypeMap';
import { specialCardMatchesCharacter } from '../../../frontend/src/lib/catalog/characterStacks';
const foil = [{ baseCardId: 'base', foilCardId: 'foil', cardType: 'power' }, { baseCardId: 'base', foilCardId: 'promo', cardType: 'power' }];
const lookup = buildFoilCardMapLookup(foil);
const ids = (cards: CatalogCard[]) => cards.map(card => card.id);
const present = (cards: CatalogCard[], type: CatalogType, characters: CatalogCard[] = []) => presentCatalog(cards, type, foil, characters) as CatalogCard[];
const powers: CatalogCard[] = [
  { id: 'alt', name: '7 - Combat', power_type: 'Combat', value: 7, set: 'ERB', set_number: '25', image: 'alternate/7.jpg' },
  { id: 'base', name: '7 - Combat', power_type: 'Combat', value: 7, set: 'ERB', set_number: '26', image: '7.jpg' },
  { id: 'foil', name: '7 - Combat', power_type: 'Combat', value: 7, set: 'ERB', set_number: '26F', is_foil: true },
  { id: 'promo', name: '7 - Combat', power_type: 'Combat', value: 7, set: 'TFCP', set_number: '3F', is_foil: true },
  { id: 'other', name: '6 - Energy', power_type: 'Energy', value: 6, set: 'SKY', set_number: '99' },
];
describe('M4 catalog presentation compatibility', () => {
  it('preserves all printing IDs and prefers default art over lower-numbered alternate art', () => {
    const rows = present(powers, 'power-cards');
    expect(ids(rows)).toEqual(ids(powers));
    expect(new Set(rows.slice(0, 4).map(row => row.presentation!.logicalCardId)).size).toBe(1);
    expect(rows[0].presentation!.addDefaultPrintingId).toBe('base');
    expect(resolveDefaultCardForDeckAdd(rows[2], 'power-cards', rows, lookup).id).toBe('base');
    expect(ids(prepareAddCardsCatalogList(rows, 'power-cards', lookup.foilToBase).cards)).toEqual(ids(prepareAddCardsCatalogList(powers, 'power-cards', lookup.foilToBase).cards));
  });
  it.each([undefined, 'ERB', 'TFCP', 'SKY'])('preserves default results in filtered subsets and preferred set %s', preferred => {
    const raw = preferred ? powers.filter(card => card.set === preferred) : powers;
    const enriched = present(powers, 'power-cards').filter(card => raw.some(row => row.id === card.id));
    expect(ids(dedupeToDefaultCatalogCards(enriched, 'power-cards', preferred).cards)).toEqual(ids(dedupeToDefaultCatalogCards(raw, 'power-cards', preferred).cards));
  });
  it('preserves printing-picker results including cross-set foil promos', () => {
    const rows = present(powers, 'power-cards');
    expect(ids(collectPrintingsForCard(rows[0], 'power-cards', rows, lookup))).toEqual(ids(collectPrintingsForCard(powers[0], 'power-cards', powers, lookup)));
  });
  it('does not merge distinct Teamwork mechanics sharing a display name', () => {
    const rows = present([{ id: 'a', name: '6 Combat', to_use: '6 Combat', followup_attack_types: 'Energy + Intelligence' }, { id: 'b', name: '6 Combat', to_use: '6 Combat', followup_attack_types: 'Brute Force + Intelligence' }], 'teamwork');
    expect(rows[0].presentation!.logicalCardId).not.toBe(rows[1].presentation!.logicalCardId);
  });
  it('preserves identity-scoped Hidden Danger search aliases without broad false positives', () => {
    const rows = present([{ id: 'hidden', name: 'Hidden Danger', set: 'SKY', set_number: '379' }, { id: 'wrong', name: 'Hidden Danger', set: 'ERB', set_number: '379' }, { id: 'wrong-name', name: 'Different card', set: 'SKY', set_number: '379' }], 'aspects');
    for (const query of ['The Green Farm', 'The Greene Farm']) {
      expect(rows.filter(card => cardMatchesSearchQuery(card, query)).map(card => card.id)).toEqual(['hidden']);
    }
    expect(rows[0].presentation!.searchAliases).toHaveLength(2);
  });
  it('supplies exact Angry Mob variant associations and excludes Any Character from stacks', () => {
    const chars: CatalogCard[] = [{ id: 'a', name: 'Angry Mob (Farmers)' }, { id: 'b', name: 'Angry Mob (Mercenaries)' }];
    const raw: CatalogCard[] = [{ id: 'all', name: 'Any mob', character: 'Angry Mob' }, { id: 'farm', name: 'Farm only', character: 'Angry Mob: Farmer' }, { id: 'any', name: 'Any character', character: 'Any Character' }];
    const rows = present(raw, 'special-cards', chars);
    for (let i = 0; i < rows.length; i++) for (const character of chars) expect(specialCardMatchesCharacter(rows[i], character.name!)).toBe(specialCardMatchesCharacter(raw[i], character.name!));
  });
  it('repeats identities/version for unchanged inputs and changes version when catalog inputs change', () => {
    expect(present(powers, 'power-cards')).toEqual(present(powers, 'power-cards'));
    const changed = powers.map(card => ({ ...card, game_effect: 'Revised public rules text' }));
    expect(present(changed, 'power-cards')[0].presentation!.catalogVersion).not.toBe(present(powers, 'power-cards')[0].presentation!.catalogVersion);
    expect(present(changed, 'power-cards')[0].presentation!.logicalCardId).toBe(present(powers, 'power-cards')[0].presentation!.logicalCardId);
  });
});
