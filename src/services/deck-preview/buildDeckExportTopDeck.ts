import type { CatalogCard, DeckCardEntry } from './types';
import { cardCharacterName, cardDisplayName } from './catalog';
import { normalizeDeckCardType, resolveDeckCatalogCard } from './catalog';
import type { BuildDeckExportJsonInput } from './buildDeckExportJson';
import { computePrePlacedFlags, isPrePlacedEligible } from './prePlaced';
import { MAX_TOTAL_THREAT } from '../deck-evaluation/deckThreat';
import { GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME, isGdaAnyCharacterSpecial } from '../deck-candidates/deckUsabilityUtils';

type TopDeckInput = Pick<BuildDeckExportJsonInput, 'cards' | 'cardIndex' | 'reserveCharacterId' | 'totalCards' | 'totalThreat'>;

const SECTION_ORDER = [
  'Characters', 'Location', 'Mission', 'Special Cards',
  'Any Character Cards', 'Universe Cards', 'Power Cards', 'Events', 'Other Cards',
];

// Effect codes recurring in the Modern public template. The catalog has no
// effect-code field; unknown cards retain their names without an invented code.
const ANY_CHARACTER_CODES: Record<string, string> = {
  disorientopponent: 'DB', freyagoddessofprotection: 'AG',
  thegemini: 'BQ', merlinsmagic: 'ZZ', grimreaper: 'BY',
  legendaryescape: 'AC', hadeslordoftheunderworld: 'EN',
  preternaturalhealing: 'AL', valkyriehildrselecttheslain: 'OP',
};

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).replace(/\s+/g, ' ').trim()
    : '';
}

function isAnyCharacterName(name: string): boolean { return name.trim().toLowerCase() === 'any character'; }

function compactPowerTypes(value: string): string {
  return value.replace(/Any[ -]?Power/gi, 'Anypower')
    .replace(/Multi[ -]?Power/gi, 'Multipower').replace(/Brute Force/gi, 'Bruteforce');
}

export function topDeckCardName(entry: DeckCardEntry, catalog: CatalogCard | undefined, type: string): string {
  const name = text(cardDisplayName(catalog)) || text(entry.name) || 'Unknown Card';
  if (!catalog) return name;
  if (type === 'power') {
    return catalog.value != null && text(catalog.power_type)
      ? `${text(catalog.value)} ${compactPowerTypes(text(catalog.power_type))}`
      : compactPowerTypes(name.replace(/^(\d+)\s*-\s*/, '$1 '));
  }
  if (type === 'character') return name.replace(/^(Angry Mob) \((.+)\)$/, '$1: $2');
  if (type === 'battleground' && name === GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME) return 'G.D.A. Battleground';
  if (type === 'special' || type === 'advanced-universe') {
    const owner = text(cardCharacterName(catalog));
    const anyCharacter = isAnyCharacterName(owner);
    const subtype = anyCharacter
      ? catalog.is_cataclysm === true || catalog.cataclysm === true ? 'cata'
        : catalog.is_assist === true || catalog.assist === true ? 'assist'
          : catalog.is_ambush === true || catalog.ambush === true ? 'ambush'
            : ANY_CHARACTER_CODES[name.toLowerCase().replace(/[^a-z0-9]/g, '')] ?? ''
      : '';
    return [anyCharacter ? 'ANY CHARACTER' : owner.toUpperCase(), subtype, name].filter(Boolean).join(': ');
  }

  // Match the recurring Modern export template rather than appending card text.
  if (type === 'teamwork') {
    const use = (text(catalog.to_use) || name).replace(/Any[ -]?Power/gi, 'Anypower');
    const base = /^Teamwork\b/i.test(use) ? use : `Teamwork ${use}`;
    if (/Anypower/i.test(use)) return base;
    const actsAs = text(catalog.acts_as).replace(/\s+Attack$/i, '');
    const followups = text(catalog.followup_attack_types ?? catalog.follow_up_attack_types)
      .split(/\s*[+/]\s*/).filter(Boolean).join('/');
    return `${base}${actsAs ? `, acts as ${actsAs}` : ''}${followups ? `; ${followups}` : ''}`;
  }
  if (type === 'training') {
    const types = [...new Set([text(catalog.type_1), text(catalog.type_2)].filter(Boolean))];
    if (types[0] === 'Any-Power' && types.length === 1) return `Training Anypower${/Sekhmet/i.test(name) ? ' Sekhmet' : ''}`;
    if (types.length) return `Training ${types.join(' ')}`;
  }
  return name;
}

function sectionFor(type: string, catalog: CatalogCard | undefined): string {
  switch (type) {
    case 'character': return 'Characters';
    case 'location': return 'Location';
    case 'battleground': return 'Location';
    case 'mission': return 'Mission';
    case 'special': return isAnyCharacterName(cardCharacterName(catalog)) ? 'Any Character Cards' : 'Special Cards';
    case 'advanced-universe':
    case 'teamwork':
    case 'ally-universe':
    case 'training':
    case 'basic-universe': return 'Universe Cards';
    case 'power': return 'Power Cards';
    case 'event': return 'Events';
    default: return 'Other Cards';
  }
}

/** Modal recurring full-export template in past-year Modern event submissions. */
export function buildDeckExportTopDeck({ cards, cardIndex, reserveCharacterId, totalCards, totalThreat }: TopDeckInput): string {
  const sections = new Map<string, Map<string, { cardId: string; label: string; quantity: number }>>();
  const attachments = new Map<string, Map<string, { quantity: number; note: string }>>();
  const missionSets = new Set<string>();
  const locations = cards.filter(entry => normalizeDeckCardType(entry.type) === 'location' && entry.quantity > 0);
  const gdaBattlegrounds = cards.filter(entry => normalizeDeckCardType(entry.type) === 'battleground' && entry.quantity > 0
    && text(cardDisplayName(resolveDeckCatalogCard(entry, cardIndex))) === GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME);
  const attach = (parentId: string, label: string, quantity: number, note: string) => {
    const attached = attachments.get(parentId) ?? new Map<string, { quantity: number; note: string }>();
    const previous = attached.get(label);
    attached.set(label, { quantity: (previous?.quantity ?? 0) + quantity, note });
    attachments.set(parentId, attached);
  };

  for (const entry of cards) {
    const quantity = Number.isFinite(entry.quantity) ? Math.max(0, Math.floor(entry.quantity)) : 0;
    if (!quantity) continue;
    const type = normalizeDeckCardType(entry.type);
    const catalog = resolveDeckCatalogCard(entry, cardIndex);
    const code = text(catalog?.set);
    let label = `${topDeckCardName(entry, catalog, type)}${code ? ` [${code}]` : ''}`;
    if (type === 'character') label += entry.cardId === reserveCharacterId ? ' [Reserve]' : ' [Frontline]';
    if (type === 'location') label += ' [Homebase]';
    if (type === 'battleground') label += ' [Battleground]';
    if (type === 'mission' && text(catalog?.mission_set)) missionSets.add(text(catalog?.mission_set));
    if (type === 'mission' && text(catalog?.mission_set)) continue;

    // This association is supported by the existing catalog rule, not guessed
    // from a card name or a pre-placement flag. Never duplicate attached copies.
    if (type === 'special' && catalog && isGdaAnyCharacterSpecial(catalog) && gdaBattlegrounds.length === 1) {
      const attachedLabel = `${text(cardDisplayName(catalog))}${code ? ` [${code}]` : ''}`;
      if (entry.exclude_from_draw === true) {
        attach(gdaBattlegrounds[0]!.cardId, `${attachedLabel} [Pre-Placed]`, 1, 'battleground special');
        if (quantity > 1) attach(gdaBattlegrounds[0]!.cardId, attachedLabel, quantity - 1, 'battleground special');
      } else {
        attach(gdaBattlegrounds[0]!.cardId, attachedLabel, quantity, 'battleground special');
      }
      continue;
    }

    const section = sectionFor(type, catalog);
    const rows = sections.get(section) ?? new Map<string, { cardId: string; label: string; quantity: number }>();
    sections.set(section, rows);
    const add = (count: number, placed = false) => {
      if (!count) return;
      const key = `${type}:${entry.cardId}:${placed}`;
      const existing = rows.get(key);
      rows.set(key, { cardId: entry.cardId, label: `${label}${placed ? ' [Pre-Placed]' : ''}`, quantity: (existing?.quantity ?? 0) + count });
    };

    if (entry.exclude_from_draw === true) {
      // The saved flag applies to one physical copy, even when the row has several.
      const parents = locations.filter(location =>
        isPrePlacedEligible({ ...entry, type: type as DeckCardEntry['type'] }, computePrePlacedFlags([location], cardIndex), cardIndex),
      );
      if (parents.length === 1) {
        const parentId = parents[0]!.cardId;
        attach(parentId, label, 1, 'on location');
      } else {
        add(1, true);
      }
      add(quantity - 1);
    } else {
      add(quantity);
    }
  }

  const output = SECTION_ORDER.flatMap(section => {
    const rows = sections.get(section);
    const lines = section === 'Mission' ? [...missionSets].map(set => `${set} - Mission Set`) : [];
    for (const row of rows?.values() ?? []) {
      lines.push(`${row.quantity}x ${row.label}`);
      if (section === 'Location') {
        for (const [label, { quantity, note }] of attachments.get(row.cardId) ?? []) {
          lines.push(`  → ${quantity > 1 ? `${quantity}x ` : ''}${label} (${note})`);
        }
      }
    }
    return lines.length ? [`-- ${section} --\n${lines.join('\n')}`] : [];
  }).join('\n\n');
  if (!output) return '';
  const minimum = cards.some(entry => normalizeDeckCardType(entry.type) === 'event' && entry.quantity > 0) ? 56 : 51;
  return `Cards: ${totalCards}/${minimum} | Threat: ${totalThreat}/${MAX_TOTAL_THREAT}\n\n${output}`;
}
