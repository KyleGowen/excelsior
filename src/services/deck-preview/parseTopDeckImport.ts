import type { CatalogCard, DeckCardEntry } from './types';
import { cardDisplayName, normalizeDeckCardType } from './catalog';
import { topDeckCardName } from './buildDeckExportTopDeck';
import { computePrePlacedFlags, isPrePlacedEligible } from './prePlaced';
import { isGdaAnyCharacterSpecial, GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME } from '../deck-candidates/deckUsabilityUtils';

export class TopDeckImportError extends Error {}
const sections: Record<string, string[]> = {
  characters: ['character'], location: ['location', 'battleground'], locations: ['location', 'battleground'],
  battlegrounds: ['battleground'], mission: ['mission'], missions: ['mission'],
  specialcards: ['special'], anycharactercards: ['special'],
  universecards: ['advanced-universe', 'teamwork', 'ally-universe', 'training', 'basic-universe'],
  powercards: ['power'], events: ['event'], othercards: ['aspect'], homebasecards: ['aspect'],
  aspect: ['aspect'], aspects: ['aspect'],
};
const key = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
type Candidate = { type: DeckCardEntry['type']; card: CatalogCard };

// Compare rules and printed requirements, not cosmetic printing metadata.
const identityFields = ['name', 'card_name', 'character', 'character_name', 'mission_set',
  'power_type', 'value', 'to_use', 'acts_as', 'followup_attack_types', 'follow_up_attack_types',
  'type_1', 'type_2', 'value_to_use', 'bonus', 'card_effect', 'card_text', 'special_ability',
  'special_abilities', 'one_per_deck', 'is_cataclysm', 'is_assist', 'is_ambush'];
function signature({ type, card }: Candidate, omitValue = false): string {
  return JSON.stringify([type, type === 'basic-universe' ? card.type ?? '' : '',
    ...identityFields.filter(field => !omitValue || field !== 'value').map(field => card[field] ?? '')]);
}
function identity(candidate: Candidate, matches: Candidate[]): string {
  const { type, card } = candidate;
  // Some ERB foil rows omit the derived Special strength. Only fill it from a
  // matching numbered base printing with identical rules and other mechanics.
  const baseNumber = String(card.set_number ?? '').match(/^(\d+)F$/i)?.[1];
  if (type === 'special' && card.is_foil === true && card.value == null && baseNumber) {
    const base = matches.find(c => c.type === type && c.card.is_foil !== true
      && String(c.card.set_number ?? '') === baseNumber && c.card.set === card.set
      && signature(c, true) === signature(candidate, true));
    if (base) return signature({ type, card: { ...card, value: base.card.value } });
  }
  return signature(candidate);
}

/** Parse the published category/quantity template against the server catalog. */
export function parseTopDeckImport(raw: string, resolved: Map<string, Record<string, unknown>>) {
  const aliases = new Map<string, Candidate[]>();
  const index = new Map<string, CatalogCard>();
  for (const [catalogKey, row] of resolved) {
    const type = normalizeDeckCardType(catalogKey.slice(0, -String(row.id).length - 1)) as DeckCardEntry['type'];
    const card = { ...row, id: String(row.id), ...(type === 'basic-universe' ? { type: row.basic_skill_type ?? row.type } : {}) } as CatalogCard;
    index.set(`${type}:${card.id}`, card);
    const candidate = { type, card };
    const formatted = topDeckCardName({ type, cardId: card.id, quantity: 1 }, card, type);
    const names = [formatted, cardDisplayName(card)];
    if (type === 'special') names.push(formatted.replace(/^ANY CHARACTER: (?:[A-Z]{2}|cata|assist|ambush): /, 'ANY CHARACTER: '));
    for (const name of new Set(names.filter(Boolean))) {
      const list = aliases.get(key(name)) ?? [];
      list.push(candidate); aliases.set(key(name), list);
    }
  }
  const cards = new Map<string, DeckCardEntry>();
  const unresolved: Array<{ name: string; type: string }> = [];
  let allowed: string[] | undefined;
  let reserveCharacterId: string | null = null;
  let parent: DeckCardEntry | undefined;
  let total = 0;
  const missionSets = new Set<string>();
  const placements: Array<{ entry: DeckCardEntry; parent: DeckCardEntry; note: string }> = [];
  function fail(line: number, message: string): never { throw new TopDeckImportError(`Line ${line}: ${message}`); }
  const add = (candidate: Candidate, quantity: number, placed: boolean, line: number) => {
    const id = `${candidate.type}:${candidate.card.id}`;
    const previous = cards.get(id);
    if ((previous?.quantity ?? 0) + quantity > 100) fail(line, 'A card cannot exceed 100 copies.');
    if (placed && previous?.exclude_from_draw) fail(line, 'The same card has more than one pre-placed copy.');
    total += quantity;
    if (total > 1000) fail(line, 'Import exceeds 1000 card copies.');
    const entry = previous ?? { type: candidate.type, cardId: candidate.card.id, quantity: 0 };
    entry.quantity += quantity;
    if (placed) entry.exclude_from_draw = true;
    cards.set(id, entry); return entry;
  };
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); const number = i + 1;
    if (!line || line === '~Deck' || /^Cards:\s*\d+\/\d+\s*\|\s*Threat:\s*\d+\/\d+$/i.test(line)) continue;
    const heading = line.match(/^--\s*(.+?)\s*--$/);
    if (heading) {
      allowed = sections[key(heading[1])]; parent = undefined;
      if (!allowed) fail(number, `Unknown section "${heading[1]}".`);
      continue;
    }
    if (!allowed) fail(number, 'Expected a section heading such as -- Characters --.');
    const mission = line.match(/^(.+?)\s+-\s+Mission Set$/i);
    if (mission && allowed.includes('mission')) {
      if (missionSets.has(key(mission[1]))) fail(number, 'Mission set appears more than once.');
      missionSets.add(key(mission[1]));
      const chosen = new Map<string, Candidate[]>();
      for (const [id, card] of index) if (id.startsWith('mission:') && key(String(card.mission_set ?? '')) === key(mission[1])) {
        const name = key(cardDisplayName(card)); const group = chosen.get(name) ?? [];
        group.push({ type: 'mission', card }); chosen.set(name, group);
      }
      if (!chosen.size) unresolved.push({ name: mission[1], type: 'mission set' });
      for (const group of chosen.values()) add(group.sort((a, b) => Number(a.card.is_foil === true) - Number(b.card.is_foil === true) || a.card.id.localeCompare(b.card.id))[0], 1, false, number);
      continue;
    }
    const attachment = line.startsWith('→');
    const content = attachment ? line.slice(1).trim() : line;
    const counted = content.match(/^(\d+)\s*x\s+(.+)$/i);
    if (!counted && !attachment) fail(number, 'Expected a quantity such as 1x Card Name.');
    const quantity = counted ? Number(counted[1]) : 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) fail(number, 'Quantity must be between 1 and 100.');
    let name = counted ? counted[2] : content;
    const note = name.match(/\s*\((on location|battleground special)\)$/i)?.[1].toLowerCase();
    if (note) name = name.replace(/\s*\((on location|battleground special)\)$/i, '');
    if (note && !attachment) fail(number, 'Attachment notes require an arrow row.');
    const annotations = [...name.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].trim());
    const reserve = annotations.some(a => /^reserve$/i.test(a));
    const placed = annotations.some(a => /^pre-placed$/i.test(a)) || note === 'on location';
    if (placed && quantity !== 1) fail(number, 'A pre-placed row must identify exactly one copy.');
    const setCodes = annotations.filter(a => !/^(reserve|frontline|homebase|battleground|pre-placed)$/i.test(a));
    if (setCodes.length > 1) fail(number, 'More than one printing code.');
    if (attachment && (!parent || !note)) fail(number, 'An attached card needs a preceding location or battleground and an attachment note.');
    name = name.replace(/\s*\[[^\]]+\]/g, '').trim();
    const types = attachment ? note === 'on location' ? ['training', 'basic-universe', 'special'] : ['special'] : allowed;
    const names = aliases.get(key(name)) ?? aliases.get(key(name.replace(/^ANY CHARACTER: (?:[A-Z]{2}|cata|assist|ambush): /i, 'ANY CHARACTER: '))) ?? [];
    let matches = names.filter(c => types.includes(c.type)
      && (!setCodes.length || key(String(c.card.set ?? '')) === key(setCodes[0])));
    if (attachment && matches.length) {
      const location = parent!;
      const flags = computePrePlacedFlags([location], index);
      matches = matches.filter(c => note === 'on location'
        ? location.type === 'location' && isPrePlacedEligible({ type: c.type, cardId: c.card.id, quantity }, flags, index)
        : location.type === 'battleground'
          && cardDisplayName(index.get(`battleground:${location.cardId}`)) === GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME
          && isGdaAnyCharacterSpecial(c.card));
      if (!matches.length) fail(number, 'An attached card does not match its location or battleground.');
    }
    const distinct = new Set(matches.map(candidate => identity(candidate, matches)));
    if (!matches.length || distinct.size > 1) {
      unresolved.push({ name: `${name}${distinct.size > 1 ? ' (ambiguous)' : ''}`, type: types.join('/') });
      if (!attachment) parent = undefined;
      continue;
    }
    const candidate = matches.sort((a, b) => Number(a.card.is_foil === true) - Number(b.card.is_foil === true) || a.card.id.localeCompare(b.card.id))[0];
    if (reserve && candidate.type !== 'character') fail(number, 'Reserve applies only to a character.');
    if (reserve && reserveCharacterId) fail(number, 'Choose exactly one reserve character.');
    if (reserve) reserveCharacterId = candidate.card.id;
    const entry = add(candidate, quantity, placed, number);
    if (attachment) placements.push({ entry, parent: parent!, note: note! });
    else parent = ['location', 'battleground'].includes(candidate.type) ? entry : undefined;
  }
  if (unresolved.length) return { ok: false as const, code: 'unresolved' as const, message: 'Could not resolve all cards in the TopDeck list', unresolved };
  if (!cards.size) throw new TopDeckImportError('No cards found in the TopDeck list.');
  for (const { entry, parent: location, note } of placements) {
    if (note === 'on location' && (location.type !== 'location' || !isPrePlacedEligible(entry, computePrePlacedFlags([location], index), index))) throw new TopDeckImportError('A pre-placed card does not match its location.');
    if (note === 'battleground special' && (location.type !== 'battleground' || cardDisplayName(index.get(`battleground:${location.cardId}`)) !== GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME || !isGdaAnyCharacterSpecial(index.get(`special:${entry.cardId}`)!))) throw new TopDeckImportError('A special does not match its battleground.');
  }
  return { ok: true as const, cards: [...cards.values()], reserveCharacterId };
}
