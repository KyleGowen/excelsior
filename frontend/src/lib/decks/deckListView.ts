import {
  cardCharacterName,
  cardDisplayName,
  compareCharacterNames,
} from '../catalog/catalogTypeMap';
import type { CatalogCard, DeckCardEntry } from '../api/types';
import {
  deckCardDisplayName,
  normalizeDeckCardType,
  resolveDeckCatalogCard,
  type DeckCardIndex,
} from './deckCardCatalog';
import { compareAlphabetically } from '../sort/alphabetical';

const PRIMARY_ICON_TYPES = ['Energy', 'Combat', 'Brute Force', 'Intelligence'] as const;
const ANY_CHARACTER = 'Any Character';

export type AttackIconType = (typeof PRIMARY_ICON_TYPES)[number] | 'Any-Power';

export interface DeckListRow {
  type: string;
  cardId: string;
  quantity: number;
  instanceIds: string[];
  representativeEntry: DeckCardEntry;
  catalogCard: CatalogCard | undefined;
  label: string;
  iconTypes: AttackIconType[];
}

export interface DeckListCharacterGroup {
  characterName: string;
  rows: DeckListRow[];
}

export interface DeckListSectionInput {
  key: string;
  label: string;
  deckType: string;
  rows: DeckListRow[];
  characterGroups?: DeckListCharacterGroup[];
}

/** Attack-type icons for list row display (includes Any-Power; multi-power → all four). */
export function attackIconsForDeckCard(
  deckType: string,
  catalog: Partial<CatalogCard> | null | undefined,
): AttackIconType[] {
  if (!catalog) return [];

  const normalized = normalizeDeckCardType(deckType);

  if (normalized === 'power') {
    const type = String(catalog.power_type ?? '').trim();
    if (type === 'Any-Power') return ['Any-Power'];
    if (/multi\s*-?power/i.test(type)) return [...PRIMARY_ICON_TYPES];
    return PRIMARY_ICON_TYPES.includes(type as (typeof PRIMARY_ICON_TYPES)[number])
      ? [type as (typeof PRIMARY_ICON_TYPES)[number]]
      : [];
  }

  if (normalized === 'teamwork') {
    const src = String(catalog.to_use ?? '');
    if (/Any-?Power/i.test(src)) return ['Any-Power'];
    return PRIMARY_ICON_TYPES.filter((t) => new RegExp(t, 'i').test(src));
  }

  if (normalized === 'ally-universe') {
    const src = String(catalog.stat_type_to_use ?? '');
    const matched = PRIMARY_ICON_TYPES.find((t) => new RegExp(t, 'i').test(src));
    return matched ? [matched] : [];
  }

  const icons = Array.isArray(catalog.icons) ? catalog.icons : [];
  const ordered: AttackIconType[] = [];
  for (const icon of PRIMARY_ICON_TYPES) {
    if (icons.includes(icon)) ordered.push(icon);
  }
  return ordered;
}

/** User-facing list row label by deck card type. */
export function formatDeckListRowLabel(
  deckType: string,
  catalog: CatalogCard | undefined,
  entry?: Pick<DeckCardEntry, 'name' | 'type' | 'cardId'>,
  cardIndex?: DeckCardIndex,
): string {
  if (entry && cardIndex) {
    const saved = entry.name?.trim();
    if (saved) return saved;
  }

  if (!catalog) {
    if (entry && cardIndex) return deckCardDisplayName(entry, cardIndex);
    return 'Unknown card';
  }

  const normalized = normalizeDeckCardType(deckType);

  if (normalized === 'power') {
    const name = cardDisplayName(catalog);
    if (name) return name;
    const value = catalog.value ?? catalog.power_value;
    const powerType = catalog.power_type;
    if (value != null && powerType) return `${value} - ${powerType}`;
    return 'Unknown Power card';
  }

  if (normalized === 'teamwork') {
    const toUse = String(catalog.to_use ?? '').trim() || cardDisplayName(catalog);
    const followup =
      catalog.followup_attack_types ?? catalog.follow_up_attack_types;
    const followupStr = followup != null ? String(followup).trim() : '';
    const first = catalog.first_attack ?? catalog.first;
    const second = catalog.second_attack ?? catalog.second;
    const ratio =
      first != null && second != null ? ` (${first}/${second})` : '';
    if (followupStr) return `${toUse} → ${followupStr}${ratio}`;
    return toUse;
  }

  if (normalized === 'ally-universe') {
    const cardName = cardDisplayName(catalog) || 'Unknown Card';
    const statToUse = catalog.stat_to_use;
    const statTypeToUse = catalog.stat_type_to_use;
    const attackValue = catalog.attack_value;
    const attackType = catalog.attack_type;

    let base = cardName;
    if (statToUse != null && statTypeToUse) {
      base = `${cardName} - ${statToUse} ${statTypeToUse}`;
    } else if (statTypeToUse) {
      base = `${cardName} - ${statTypeToUse}`;
    } else if (statToUse != null) {
      base = `${cardName} - ${statToUse}`;
    }

    if (attackValue != null && attackType) {
      return `${base} → ${attackValue} ${attackType}`;
    }
    return base;
  }

  return cardDisplayName(catalog) || 'Unknown card';
}

function compareListRowLabels(a: DeckListRow, b: DeckListRow): number {
  return compareAlphabetically(a.label, b.label);
}

/** Merge instance rows sharing type + cardId into aggregated list rows. */
export function aggregateDeckListRows(
  entries: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DeckListRow[] {
  const groups = new Map<string, DeckCardEntry[]>();

  for (const entry of entries) {
    const key = `${normalizeDeckCardType(entry.type)}:${entry.cardId}`;
    const arr = groups.get(key) ?? [];
    arr.push(entry);
    groups.set(key, arr);
  }

  const rows: DeckListRow[] = [];
  for (const [, groupEntries] of groups) {
    const representative = groupEntries[0];
    const catalogCard = resolveDeckCatalogCard(representative, cardIndex);
    const deckType = normalizeDeckCardType(representative.type);
    rows.push({
      type: deckType,
      cardId: representative.cardId,
      quantity: groupEntries.length,
      instanceIds: groupEntries
        .map((e) => e.instanceId)
        .filter((id): id is string => Boolean(id)),
      representativeEntry: representative,
      catalogCard,
      label: formatDeckListRowLabel(deckType, catalogCard, representative, cardIndex),
      iconTypes: attackIconsForDeckCard(deckType, catalogCard),
    });
  }

  return rows.sort(compareListRowLabels);
}

/** Group special-card list rows by linked character (Any Character last). */
export function groupSpecialCardsByCharacter(rows: DeckListRow[]): DeckListCharacterGroup[] {
  const byCharacter = new Map<string, DeckListRow[]>();

  for (const row of rows) {
    const character = cardCharacterName(row.catalogCard) || ANY_CHARACTER;
    const arr = byCharacter.get(character) ?? [];
    arr.push(row);
    byCharacter.set(character, arr);
  }

  const groups: DeckListCharacterGroup[] = [];
  for (const [characterName, characterRows] of byCharacter) {
    groups.push({
      characterName,
      rows: [...characterRows].sort(compareListRowLabels),
    });
  }

  groups.sort((a, b) => compareCharacterNames(a.characterName, b.characterName));

  return groups;
}

export function sectionRowCount(section: DeckListSectionInput): number {
  if (section.characterGroups) {
    return section.characterGroups.reduce((sum, g) => sum + g.rows.length, 0);
  }
  return section.rows.length;
}

export function sectionCardCount(section: DeckListSectionInput): number {
  if (section.characterGroups) {
    return section.characterGroups.reduce(
      (sum, g) => sum + g.rows.reduce((s, r) => s + r.quantity, 0),
      0,
    );
  }
  return section.rows.reduce((sum, r) => sum + r.quantity, 0);
}

/**
 * Greedy column split: assign each section to the column with fewer rows so far.
 * Stable order preserved within each column.
 */
export function balanceSectionsIntoColumns<T extends { key: string }>(
  sections: T[],
  rowCountFn: (section: T) => number,
): [T[], T[]] {
  const left: T[] = [];
  const right: T[] = [];
  let leftTotal = 0;
  let rightTotal = 0;

  for (const section of sections) {
    const count = rowCountFn(section);
    if (leftTotal <= rightTotal) {
      left.push(section);
      leftTotal += count;
    } else {
      right.push(section);
      rightTotal += count;
    }
  }

  return [left, right];
}

export function buildDeckListSection(
  key: string,
  label: string,
  deckType: string,
  entries: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DeckListSectionInput {
  const rows = aggregateDeckListRows(entries, cardIndex);
  if (normalizeDeckCardType(deckType) === 'special') {
    return {
      key,
      label,
      deckType,
      rows: [],
      characterGroups: groupSpecialCardsByCharacter(rows),
    };
  }
  return { key, label, deckType, rows };
}
