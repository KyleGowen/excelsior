import { readFileSync } from 'fs';
import { join } from 'path';
import { buildImportCatalogMap } from '../../../src/services/deck-preview/resolveImportCardIds';
import { parseTopDeckImport, TopDeckImportError } from '../../../src/services/deck-preview/parseTopDeckImport';
import { buildDeckExportTopDeck } from '../../../src/services/deck-preview/buildDeckExportTopDeck';
import type { CatalogCard, DeckCardEntry } from '../../../src/services/deck-preview/types';

const rows: Array<[DeckCardEntry['type'], CatalogCard]> = [
  ['character', { id: 'mob', name: 'Angry Mob (Middle Ages)', set: 'ERB' }],
  ['character', { id: 'mina', name: 'Mina Harker', set: 'ERB' }],
  ['location', { id: 'base', name: "Dracula's Armory", set: 'ERBP' }],
  ['battleground', { id: 'gda', name: 'Global Defense Agency', set: 'SKY' }],
  ['special', { id: 'special', name: 'The Hunger', character: 'Mina Harker', set: 'ERB' }],
  ['special', { id: 'any', name: "Merlin's Magic", character: 'Any Character', set: 'ERB' }],
  ['special', { id: 'assist', name: 'Charge into Battle!', character: 'Any Character', is_assist: true, set: 'ERB' }],
  ['special', { id: 'robot', name: 'Robot', character: 'Any Character', set: 'SKY', set_number: '365' }],
  ['aspect', { id: 'cat', card_name: 'Cheshire Cat', set: 'ERB' }],
  ['basic-universe', { id: 'ray', card_name: 'Ray Gun', set: 'ERB' }],
  ['ally-universe', { id: 'ally', card_name: 'Professor Porter', set: 'ERB' }],
  ['training', { id: 'training', card_name: 'Training', type_1: 'Energy', type_2: 'Brute Force', set: 'ERB' }],
  ['advanced-universe', { id: 'advanced', name: 'Divine Weapon', character: 'Ra', set: 'ERB' }],
  ['teamwork', { id: 'tw', name: '6 Energy', to_use: '6 Energy', acts_as: '4 Attack', followup_attack_types: 'Brute Force + Intelligence', set: 'ERB' }],
  ['power', { id: 'power', name: '5 - Multi Power', value: 5, power_type: 'Multi Power', set: 'ERBP' }],
  ['event', { id: 'event', name: 'The Power of Gonfal', set: 'ERB' }],
  ...Array.from({ length: 7 }, (_, i): [DeckCardEntry['type'], CatalogCard] => ['mission', { id: `mission${i}`, name: `Mission ${i}`, mission_set: 'King of the Jungle', set: 'ERB' }]),
];
const catalog = () => new Map(rows.map(([type, card]) => [`${type.replace(/-/g, '_')}_${card.id}`, card as Record<string, unknown>]));
const parse = (raw: string) => parseTopDeckImport(raw, catalog());

describe('structured TopDeck import', () => {
  it('resolves the full reported deck against its catalog printings without changing the catalog', () => {
    // Public catalog snapshot, limited to this list's cards and same-name candidates.
    // Retains foil metadata omissions and the cross-type Trident collision.
    const raw = readFileSync(join(__dirname, '../../fixtures/topdeck/modern-horror.txt'), 'utf8');
    const snapshot = JSON.parse(readFileSync(join(__dirname, '../../fixtures/topdeck/modern-horror-catalog.json'), 'utf8'));
    const c = buildImportCatalogMap(snapshot);
    const before = JSON.stringify([...c]);
    const parsed = parseTopDeckImport(raw, c);
    expect(parsed).toMatchObject({ ok: true });
    if (!parsed.ok) throw new Error(JSON.stringify(parsed));
    expect(parsed.cards).toHaveLength(67);
    expect(parsed.cards.reduce((total, card) => total + card.quantity, 0)).toBe(76);
    expect(parsed.reserveCharacterId).toBe('5f21a9b5-9bfb-48f4-a34f-4e173d4bd2e6');
    expect(parsed.cards.filter(card => card.type === 'mission')).toHaveLength(7);
    expect(parsed.cards.filter(card => card.type === 'aspect')).toHaveLength(1);
    expect(parsed.cards.filter(card => card.exclude_from_draw)).toHaveLength(3);
    expect(parsed.cards).toEqual(expect.arrayContaining([
      { type: 'basic-universe', cardId: '76bd7eb8-266b-4db2-b6d3-19944ac3b863', quantity: 1, exclude_from_draw: true },
      { type: 'special', cardId: '266897fd-8fff-4d43-a0ab-7a9e6c0c7c43', quantity: 1 },
      { type: 'special', cardId: '5eb851a9-a317-4a21-8874-6fad06cf56e1', quantity: 2 },
      { type: 'special', cardId: 'b72263bb-dc86-41ce-8af1-f70a157c3a29', quantity: 1 },
    ]));
    expect(JSON.stringify([...c])).toBe(before);
  });

  it('round trips every card type, printing codes, reserve, G.D.A. attachments and one pre-placed physical copy', () => {
    const cards = rows.map(([type, card]) => ({ type, cardId: card.id, quantity: type === 'basic-universe' || type === 'special' ? 2 : 1, ...(card.id === 'ray' ? { exclude_from_draw: true } : {}) }));
    const index = new Map(rows.map(([type, card]) => [`${type}:${card.id}`, card]));
    const exported = buildDeckExportTopDeck({ cards, cardIndex: index, reserveCharacterId: 'mina', totalCards: 20, totalThreat: 76 });
    const result = parse(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.reserveCharacterId).toBe('mina');
    for (const card of cards) expect(result.cards).toContainEqual(card);
    expect(result.cards).toHaveLength(cards.length);
    expect(result.cards.find(c => c.cardId === 'cat')?.type).toBe('aspect');
  });
  it.each(['Other Cards', 'Homebase Cards', 'Aspects'])('accepts Aspect cards under %s', heading => {
    expect(parse(`-- ${heading} --\n1x Cheshire Cat [ERB]`)).toMatchObject({ ok: true, cards: [{ type: 'aspect', cardId: 'cat', quantity: 1 }] });
  });
  it('supports Windows newlines, case variation and the optional generic ~Deck line', () => {
    expect(parse('~Deck\r\n\r\n-- Power Cards --\r\n2x 5 multipower [ERBP]')).toMatchObject({ ok: true, cards: [{ cardId: 'power', quantity: 2 }] });
  });
  it('resolves a published effect code without treating the code as an identity', () => {
    expect(parse("-- Any Character Cards --\n1x ANY CHARACTER: ZZ: Merlin's Magic [ERB]")).toMatchObject({ ok: true, cards: [{ cardId: 'any' }] });
    expect(parse('-- Any Character Cards --\n1x ANY CHARACTER: XX: Charge into Battle! [ERB]')).toMatchObject({ ok: true, cards: [{ cardId: 'assist' }] });
  });
  it('expands a summary to one copy of each mission without duplicating alternate printings', () => {
    const c = catalog(); c.set('mission_alt', { ...rows.at(-1)![1], id: 'alt', is_foil: true });
    const result = parseTopDeckImport('-- Mission --\nKing of the Jungle - Mission Set', c);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.cards).toHaveLength(7);
  });
  it('fails the whole import for unknown cards, wrong printing codes and ambiguous mechanics', () => {
    expect(parse('-- Power Cards --\n1x 5 Multipower [ERB]')).toMatchObject({ ok: false, code: 'unresolved' });
    expect(parse('-- Other Cards --\n1x Missing Card')).toMatchObject({ ok: false, unresolved: [{ name: 'Missing Card', type: 'aspect' }] });
    const c = catalog(); c.set('power_other', { ...rows.find(r => r[1].id === 'power')![1], id: 'other', card_text: 'Different printed mechanic' });
    expect(parseTopDeckImport('-- Power Cards --\n1x 5 Multipower [ERBP]', c)).toMatchObject({ ok: false, unresolved: [{ name: '5 Multipower (ambiguous)', type: 'power' }] });
  });
  it.each([
    '-- Other Cards --\n0x Cheshire Cat', '-- Other Cards --\n101x Cheshire Cat',
    '-- Other Cards --\n1x Cheshire Cat\n100x Cheshire Cat', '-- Made Up --\n1x Cheshire Cat',
    '-- Other Cards --\nCheshire Cat', '-- Other Cards --\n1x Cheshire Cat\nThis is an unparsed note',
    '-- Characters --\n1x Mina Harker [Reserve]\n1x Angry Mob: Middle Ages [Reserve]',
    '-- Other Cards --\n1x Cheshire Cat [Reserve]', '-- Universe Cards --\n2x Ray Gun [Pre-Placed]',
    '-- Location --\n→ Ray Gun [ERB] (on location)',
    "-- Location --\n1x Dracula's Armory [ERBP] [Homebase]\n→ Robot [SKY] (battleground special)",
    '-- Mission --\nKing of the Jungle - Mission Set\nKing of the Jungle - Mission Set',
    '',
  ])('rejects malformed structure without guessing or skipping rows: %s', raw => {
    expect(() => parse(raw)).toThrow(TopDeckImportError);
  });
  it('does not mutate the catalog', () => {
    const c = catalog(); const before = JSON.stringify([...c]);
    parseTopDeckImport('-- Other Cards --\n1x Cheshire Cat [ERB]', c);
    expect(JSON.stringify([...c])).toBe(before);
  });

  it('resolves the reported Specials when a numbered foil lacks derived strength', () => {
    const cards = [
      ['239', 'Fury of the Desert', 'The Mummy'],
      ['155', 'Jonathan Harker, Solicitor', 'Mina Harker'],
      ['156', 'Nocturnal Hunter', 'Mina Harker'],
    ];
    const c = new Map<string, Record<string, unknown>>();
    for (const [number, name, owner] of cards) {
      const base = { id: number, name, character: owner, set: 'ERB', set_number: number, value: 5, card_effect: 'Same printed rule.', is_foil: false };
      c.set(`special_${number}`, base);
      c.set(`special_${number}F`, { ...base, id: `${number}F`, set_number: `${number}F`, value: null, is_foil: true });
    }
    const text = '-- Special Cards --\n' + cards.map(([, name, owner]) => `1x ${owner.toUpperCase()}: ${name} [ERB]`).join('\n');
    const before = JSON.stringify([...c]);
    const parsed = parseTopDeckImport(text, c);
    expect(parsed).toMatchObject({ ok: true });
    if (parsed.ok) expect(parsed.cards.map(card => card.cardId)).toEqual(['239', '155', '156']);
    expect(JSON.stringify([...c])).toBe(before);
  });
  it.each([
    { set_number: '999F', value: null },
    { set_number: '239F', value: 4 },
    { set_number: '239F', value: null, card_effect: 'Different printed rule.' },
    { set_number: '239F', value: null, one_per_deck: true },
  ])('retains a genuine or unverified foil conflict: %j', difference => {
    const base = { id: 'base', name: 'Fury of the Desert', character: 'The Mummy', set: 'ERB', set_number: '239', value: 5, card_effect: 'Printed rule.', one_per_deck: false, is_foil: false };
    const c = new Map<string, Record<string, unknown>>([
      ['special_base', base],
      ['special_foil', { ...base, id: 'foil', is_foil: true, ...difference }],
    ]);
    expect(parseTopDeckImport('-- Special Cards --\n1x THE MUMMY: Fury of the Desert [ERB]', c)).toMatchObject({ ok: false, code: 'unresolved' });
  });
  it('uses the Armory attachment rule to select Basic Trident over Poseidon’s Special', () => {
    const c = catalog();
    c.set('basic_universe_trident', { id: 'trident', card_name: 'Trident', set: 'ERB', basic_skill_type: 'Brute Force', value_to_use: '6 or greater', bonus: '+3' });
    c.set('special_poseidon', { id: 'poseidon', name: 'Trident', character: 'Poseidon', set: 'ERB', card_effect: 'Acts as a level 4 Combat attack.' });
    expect(parseTopDeckImport("-- Location --\n1x Dracula's Armory [ERBP] [Homebase]\n→ Trident [ERB] (on location)", c)).toMatchObject({ ok: true, cards: [
      { type: 'location', cardId: 'base', quantity: 1 },
      { type: 'basic-universe', cardId: 'trident', quantity: 1, exclude_from_draw: true },
    ] });
  });
  it('keeps same-name Basic Universe cards with different skill requirements ambiguous', () => {
    const c = catalog();
    for (const [id, skill] of [['combat', 'Combat'], ['energy', 'Energy']]) c.set(`basic_universe_${id}`, { id, card_name: 'Same Name', set: 'ERB', basic_skill_type: skill, value_to_use: '6 or greater', bonus: '+3' });
    expect(parseTopDeckImport('-- Universe Cards --\n1x Same Name [ERB]', c)).toMatchObject({ ok: false, code: 'unresolved' });
  });
});
