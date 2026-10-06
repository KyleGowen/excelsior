import { createHash } from 'crypto';
import type { CatalogPresentationDto } from '../../api/dto/v1/CatalogPresentationDto';
import type { CatalogCard, CatalogType, FoilMapEntry } from './types';
import { buildFoilCardMapLookup, isFoilCard } from './foilCatalog';
import { compareDefaultRepresentative, isAlternateArtCard, normalizeSet, resolveDefaultCardForDeckAdd, variantGroupKey } from './defaultCatalogCards';
import { cardCharacterName, cardDisplayName, cardSearchAliases, cardSearchHaystack } from './displayFields';

export const CATALOG_PRESENTATION_TYPES: readonly CatalogType[] = ['characters', 'special-cards', 'power-cards', 'locations', 'battlegrounds', 'missions', 'events', 'aspects', 'advanced-universe', 'teamwork', 'ally-universe', 'training', 'basic-universe'];
export type PresentedCatalogCard = CatalogCard & { presentation: CatalogPresentationDto };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

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
  const catalogVersion = hash(JSON.stringify({ type, cards, foilEntries, characters }));
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
