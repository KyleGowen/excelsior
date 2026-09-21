import type { CatalogCard, CatalogType } from '../api/types';
import type { FoilCardMapLookup } from './foilCatalog';
import { isFoilCard } from './foilCatalog';
import { variantGroupKey } from './defaultCatalogCards';
import { compareAlphabetically } from '../sort/alphabetical';

/** Sort key for checklist # (209, 519, 519F, 035F). Missing # sorts last within set. */
function setNumberSortTuple(setNumRaw: string | null | undefined): [number, number, string] {
  const s = setNumRaw != null ? String(setNumRaw).trim().toUpperCase() : '';
  if (!s) return [Number.MAX_SAFE_INTEGER, 1, ''];
  const foil = s.endsWith('F');
  const core = foil ? s.slice(0, -1) : s;
  const n = parseInt(core, 10);
  const num = Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
  const foilOrder = foil ? 1 : 0;
  return [num, foilOrder, s];
}

function resolveAnchorCard(
  card: CatalogCard,
  catalogById: Map<string, CatalogCard>,
  foilLookup: FoilCardMapLookup,
): CatalogCard {
  if (isFoilCard(card)) {
    const baseId = foilLookup.foilToBase.get(card.id);
    if (baseId) {
      const base = catalogById.get(baseId);
      if (base) return base;
    }
  }
  return card;
}

function comparePrintings(
  a: CatalogCard,
  b: CatalogCard,
  setNameFor: (set: string | undefined) => string,
): number {
  const setA = setNameFor(a.set as string | undefined);
  const setB = setNameFor(b.set as string | undefined);
  const setCmp = compareAlphabetically(setA, setB);
  if (setCmp !== 0) return setCmp;

  const [numA, foilA, rawA] = setNumberSortTuple(a.set_number as string | null | undefined);
  const [numB, foilB, rawB] = setNumberSortTuple(b.set_number as string | null | undefined);
  if (numA !== numB) return numA - numB;
  if (foilA !== foilB) return foilA - foilB;
  return rawA.localeCompare(rawB);
}

function missingSkyboundFoilPrinting(
  base: CatalogCard,
  foilId: string,
  catalogById: Map<string, CatalogCard>,
): CatalogCard | undefined {
  if (catalogById.has(foilId) || String(base.set ?? '') !== 'SKY') return undefined;
  const foilNumber = String(base.set_number_foil ?? '').trim();
  if (!/^\d+F$/i.test(foilNumber)) return undefined;
  return {
    ...base,
    id: foilId,
    set_number: foilNumber,
    set_number_foil: null,
    is_foil: true,
  };
}

/**
 * All catalog printings for a card (alternate art + foil rows), sorted by set name then checklist #.
 */
export function collectPrintingsForCard(
  card: CatalogCard,
  catalogType: CatalogType,
  allCatalogCards: CatalogCard[],
  foilLookup: FoilCardMapLookup,
  setNameFor: (set: string | undefined) => string = (set) => String(set ?? ''),
): CatalogCard[] {
  const catalogById = new Map(allCatalogCards.map((c) => [c.id, c]));
  const anchor = resolveAnchorCard(card, catalogById, foilLookup);
  const refKey = variantGroupKey(anchor, catalogType);
  if (!refKey) return [card];

  const baseRows = allCatalogCards.filter(
    (c) => !isFoilCard(c) && variantGroupKey(c, catalogType) === refKey,
  );

  const printings: CatalogCard[] = [];
  const seen = new Set<string>();

  const addPrinting = (row: CatalogCard | undefined) => {
    if (!row || seen.has(row.id)) return;
    seen.add(row.id);
    printings.push(row);
  };

  for (const base of baseRows) {
    addPrinting(base);
    const foilId = foilLookup.baseToFoil.get(base.id);
    if (foilId) {
      addPrinting(
        catalogById.get(foilId)
          ?? missingSkyboundFoilPrinting(base, foilId, catalogById),
      );
    }
  }

  // Foil-only promos (no base row in catalog)
  for (const row of allCatalogCards) {
    if (!isFoilCard(row)) continue;
    if (variantGroupKey(row, catalogType) !== refKey) continue;
    const baseId = foilLookup.foilToBase.get(row.id);
    if (baseId && catalogById.has(baseId)) continue;
    addPrinting(row);
  }

  // Ensure the requested card is included (e.g. foil when base list was empty)
  addPrinting(card);

  printings.sort((a, b) => comparePrintings(a, b, setNameFor));
  return printings;
}

export function hasMultiplePrintings(
  card: CatalogCard,
  catalogType: CatalogType,
  allCatalogCards: CatalogCard[],
  foilLookup: FoilCardMapLookup,
): boolean {
  return collectPrintingsForCard(card, catalogType, allCatalogCards, foilLookup).length > 1;
}
