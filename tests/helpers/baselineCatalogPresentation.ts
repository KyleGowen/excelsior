// Frozen 217b7dd2 algorithm: differential contract coverage for the indexed implementation.
import { createHash } from 'crypto';
import type { CatalogPresentationDto } from '../../src/api/dto/v1/CatalogPresentationDto';
import type { CatalogCard, CatalogType, FoilMapEntry } from '../../src/services/catalog-presentation/types';
import { buildFoilCardMapLookup, isFoilCard, type FoilCardMapLookup } from '../../src/services/catalog-presentation/foilCatalog';
import { compareDefaultRepresentative, isAlternateArtCard, normalizeSet, variantGroupKey } from '../../src/services/catalog-presentation/defaultCatalogCards';
import { cardCharacterName, cardDisplayName, cardSearchAliases, cardSearchHaystack } from '../../src/services/catalog-presentation/displayFields';

export const CATALOG_PRESENTATION_TYPES: readonly CatalogType[] = ['characters', 'special-cards', 'power-cards', 'locations', 'battlegrounds', 'missions', 'events', 'aspects', 'advanced-universe', 'teamwork', 'ally-universe', 'training', 'basic-universe'];
export type PresentedCatalogCard = CatalogCard & { presentation: CatalogPresentationDto };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

/** Content version shared by presentation generation and its bounded service cache. */
export function catalogPresentationVersion(cards: CatalogCard[], type: CatalogType, foilEntries: FoilMapEntry[], characters: CatalogCard[]): string {
  return hash(JSON.stringify({ type, cards, foilEntries, characters }));
}

/** Preserve the characterized Angry Mob association rather than interpreting arbitrary rules text. */
function linkedCharacterMatches(linked: string, name: string): boolean {
  if (!linked || linked === 'Any Character') return false;
  if (linked.startsWith('Angry Mob') && name.startsWith('Angry Mob')) {
    if (linked === 'Angry Mob') return true;
    const separator = linked.includes(':') ? ':' : linked.includes(' - ') ? ' - ' : null;
    if (!separator) return false;
    const qualifier = linked.split(separator)[1]?.trim() ?? '';
    const target = name.match(/\(([^)]+)\)/)?.[1];
    const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
    return target !== undefined && normalize(qualifier) === normalize(target);
  }
  return linked === name;
}

/** Catalog-only calculation: no player/session state, mutation, or browser dependencies. */
export function presentCatalog(cards: CatalogCard[], type: CatalogType, foilEntries: FoilMapEntry[], characters: CatalogCard[]): PresentedCatalogCard[] {
  const lookup = buildFoilCardMapLookup(foilEntries);
  const byId = new Map(cards.map(card => [card.id, card]));
  const keyFor = (card: CatalogCard) => {
    const base = isFoilCard(card) ? byId.get(lookup.foilToBase.get(card.id) ?? '') : undefined;
    return variantGroupKey(base ?? card, type);
  };
  const groups = new Map<string, CatalogCard[]>();
  for (const card of cards) {
    const key = keyFor(card) ?? card.id;
    const group = groups.get(key) ?? [];
    group.push(card); groups.set(key, group);
  }
  // Versions include linked-character and foil inputs as well as card contents.
  const catalogVersion = catalogPresentationVersion(cards, type, foilEntries, characters);
  const characterNames = [...new Set(characters.map(cardDisplayName))];
  const printingIdsFor = (card: CatalogCard, key: string | null) => {
    if (!key) return [card.id];
    const selected = new Set<string>();
    for (const row of cards) {
      if (isFoilCard(row) || variantGroupKey(row, type) !== key) continue;
      selected.add(row.id);
      const foilId = lookup.baseToFoil.get(row.id);
      if (foilId && byId.has(foilId)) selected.add(foilId);
    }
    for (const row of cards) {
      if (!isFoilCard(row) || variantGroupKey(row, type) !== key) continue;
      const baseId = lookup.foilToBase.get(row.id);
      if (!baseId || !byId.has(baseId)) selected.add(row.id);
    }
    selected.add(card.id);
    return [...selected];
  };
  return cards.map(card => {
    const groupKey = keyFor(card);
    const group = groups.get(groupKey ?? card.id)!;
    const ranked = group.slice().sort((a, b) => compareDefaultRepresentative(a, b, type));
    const linked = cardCharacterName(card);
    const names = type === 'special-cards'
      ? characterNames.filter(name => linkedCharacterMatches(linked, name))
      : type === 'advanced-universe' && linked && linked !== 'Any Character' ? [linked] : [];
    const presentation: CatalogPresentationDto = {
      schemaVersion: 1, catalogVersion, rulesVersion: 'catalog-presentation-compatibility-v1',
      logicalCardId: hash(type + ':' + (groupKey ?? card.id)), printingId: card.id, groupKey,
      isFoil: isFoilCard(card), isAlternateArt: isAlternateArtCard(card), normalizedSet: normalizeSet(card.set),
      defaultRank: ranked.findIndex(row => row.id === card.id),
      addDefaultPrintingId: resolveDefaultCardForDeckAdd(card, type, cards, lookup).id,
      basePrintingId: lookup.foilToBase.get(card.id) ?? null, foilPrintingId: lookup.baseToFoil.get(card.id) ?? null,
      missingFoilPrinting: lookup.baseToFoil.has(card.id) && !byId.has(lookup.baseToFoil.get(card.id)!) && card.set === 'SKY' && /^\d+F$/i.test(String(card.set_number_foil ?? '').trim())
        ? { printingId: lookup.baseToFoil.get(card.id)!, setNumber: String(card.set_number_foil).trim() } : null,
      printingIds: printingIdsFor(card, groupKey), searchText: cardSearchHaystack(card), searchAliases: cardSearchAliases(card), characterNames: names,
    };
    return { ...card, presentation };
  });
}

function pickDefaultRepresentative(
  group: CatalogCard[],
  catalogType: CatalogType,
  preferredSet?: string,
): CatalogCard {
  const normalizedPreferredSet = preferredSet ? normalizeSet(preferredSet) : '';
  const preferredRows = normalizedPreferredSet
    ? group.filter((card) => normalizeSet(card.set as string | undefined) === normalizedPreferredSet)
    : [];
  const candidates = preferredRows.length > 0 ? preferredRows : group;
  return candidates.slice().sort((a, b) => compareDefaultRepresentative(a, b, catalogType))[0];
}

/**
 * Resolve the catalog row to store when adding a card to a deck: non-foil when available,
 * otherwise foil-only; prefer default (non-alternate) art; lowest checklist # among ties.
 */
function resolveDefaultCardForDeckAdd(
  card: CatalogCard,
  catalogType: CatalogType,
  allCatalogCards: CatalogCard[],
  foilLookup?: Pick<FoilCardMapLookup, 'foilToBase' | 'baseToFoil'>,
): CatalogCard {
  const foilToBase = foilLookup?.foilToBase ?? new Map<string, string>();
  const baseToFoil = foilLookup?.baseToFoil ?? new Map<string, string>();

  const anchor = (() => {
    if (isFoilCard(card)) {
      const baseId = foilToBase.get(card.id);
      if (baseId) {
        const base = allCatalogCards.find((c) => c.id === baseId);
        if (base) return base;
      }
      return card;
    }
    return card;
  })();

  const key = variantGroupKey(anchor, catalogType);
  if (!key) return card;

  const group: CatalogCard[] = [];
  const seen = new Set<string>();
  const add = (row: CatalogCard | undefined) => {
    if (!row || seen.has(row.id)) return;
    seen.add(row.id);
    group.push(row);
  };

  for (const row of allCatalogCards) {
    if (variantGroupKey(row, catalogType) === key) {
      add(row);
    }
  }

  for (const row of [...group]) {
    if (!isFoilCard(row)) {
      add(allCatalogCards.find((c) => c.id === baseToFoil.get(row.id)));
    }
  }

  if (group.length === 0) return card;
  return pickDefaultRepresentative(group, catalogType);
}
