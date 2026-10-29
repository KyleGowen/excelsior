import type { DeckCard } from '../../src/types';
import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';
import { buildDeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import { defaultDeckValidationRuleList } from '../../src/services/deck-validation/rules';
import { isRainbowBridgeAnyCharacterSpecial as serverPool } from '../../src/services/deck-validation/deck-validation-utils';
import { isRainbowBridgeAnyCharacterSpecial as candidatePool } from '../../src/services/deck-candidates/deckUsabilityUtils';
import { buildDeckUsabilityContext, isCatalogCardUsable } from '../../tests/helpers/serverCandidateCharacterization';

const erb = { id: 'erb-special', name: 'Wild', character: 'Any Character', set: 'ERB' };
const promo = { ...erb, id: 'promo-special', set: 'ERBP', is_foil: true };
const gda = { ...erb, id: 'gda-special', name: 'Green Ghost', set: 'SKY', set_number: '349' };
const bridge = { id: 'bridge', name: 'Rainbow Bridge', set: 'ERBP' };
const agency = { id: 'agency', name: 'Global Defense Agency', set: 'SKY' };
const catalog = { 'special-cards': [erb, promo, gda], battlegrounds: [bridge, agency] };
const special = (cardId = erb.id, quantity = 1): DeckCard => ({ id: `special-${cardId}`, type: 'special', cardId, quantity });
const battleground = (cardId = bridge.id, quantity = 1): DeckCard => ({ id: `battleground-${cardId}`, type: 'battleground', cardId, quantity });

function permissionErrors(cards: DeckCard[]) {
  const available = new Map<string, Record<string, unknown>>();
  catalog['special-cards'].forEach(card => available.set(`special_${card.id}`, card));
  catalog.battlegrounds.forEach(card => available.set(`battleground_${card.id}`, card));
  const ctx = buildDeckValidationContext(cards, available);
  return [...defaultDeckValidationRuleList()]
    .flatMap(rule => rule.validate(ctx))
    .filter(error => error.rule.includes('any_character') || error.rule === 'battleground_count');
}

function usable(card: CatalogCard, cards: DeckCardEntry[]) {
  return isCatalogCardUsable(card, 'special-cards', buildDeckUsabilityContext(cards, catalog));
}

describe('Rainbow Bridge Any Character permission', () => {
  it.each([erb, promo])('requires Rainbow Bridge for $set printings', card => {
    expect(permissionErrors([special(card.id)])).toEqual([{
      rule: 'erb_any_character_requires_battleground',
      message: 'ERB Any Character Special cards (including ERBP promos) require the "Rainbow Bridge" Battleground in your deck',
    }]);
    expect(permissionErrors([special(card.id), battleground(agency.id)])
      .map(error => error.rule)).toContain('erb_any_character_requires_battleground');
    expect(permissionErrors([special(card.id), battleground()])).toEqual([]);
  });

  it('allows ERB and ERBP printings together with Rainbow Bridge', () => {
    expect(permissionErrors([special(), special(promo.id), battleground()])).toEqual([]);
  });

  it('does not grant permission from a zero-quantity Battleground', () => {
    expect(permissionErrors([special(), battleground(bridge.id, 0)])
      .map(error => error.rule)).toEqual(['erb_any_character_requires_battleground']);
    expect(usable(erb, [battleground(bridge.id, 0)])).toBe(false);
  });

  it('ignores absent/zero-quantity specials and keeps G.D.A. permission independent', () => {
    expect(permissionErrors([])).toEqual([]);
    expect(permissionErrors([special(erb.id, 0)])).toEqual([]);
    expect(permissionErrors([special(gda.id), battleground(agency.id)])).toEqual([]);
    expect(permissionErrors([special(gda.id), battleground()])
      .map(error => error.rule)).toEqual(['gda_any_character_requires_battleground']);
  });

  it('keeps mixed ERB/G.D.A. pools invalid even with both Battlegrounds', () => {
    expect(permissionErrors([special(), special(gda.id), battleground(), battleground(agency.id)])
      .map(error => error.rule)).toEqual(['battleground_count', 'gda_any_character_exclusive']);
    expect(usable(erb, [battleground(), special(gda.id)])).toBe(false);
    expect(usable(gda, [battleground(agency.id), special()])).toBe(false);
  });

  it.each([erb, promo])('updates Hide Unusables when Rainbow Bridge is added, removed, or replaced ($set)', card => {
    expect(usable(card, [])).toBe(false);
    expect(usable(card, [battleground()])).toBe(true);
    expect(usable(card, [battleground(agency.id)])).toBe(false);
    expect(usable(card, [])).toBe(false);
  });

  it.each([
    [erb, true], [promo, true],
    [{ set: ' erbp ', character_name: 'Any Character' }, true],
    [{ set: 'ERB', characters: ['Any Character'] as string[] }, true],
    [{ ...erb, character: 'Sherlock Holmes' }, false], [gda, false],
    [{ ...erb, set: 'TFCP' }, false], [{ ...erb, set: undefined }, false],
  ] as const)('uses the same set/owner identity on the validator and Add Cards candidates (%#)', (card, expected) => {
    expect(serverPool(card)).toBe(expected);
    expect(candidatePool(card)).toBe(expected);
  });

  it('leaves character-specific specials and other sets outside this permission', () => {
    expect(usable({ ...erb, id: 'unrestricted', set: 'TFCP' }, [])).toBe(true);
    expect(usable({ ...erb, character: 'Sherlock Holmes' }, [battleground()])).toBe(false);
  });
});
