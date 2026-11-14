import type { CatalogCard } from '../api/types';

export function setCodeForCard(card: Partial<CatalogCard>): string {
  return String(card.set ?? (card.universe as string) ?? 'ERB').trim();
}

export function parseSetNumber(card: Partial<CatalogCard>): number | null {
  const raw = String(card.set_number ?? '').trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function isSkyboundPrizePackPrinting(card: Partial<CatalogCard>): boolean {
  return setCodeForCard(card) === 'SKY' && /^PP\d{3}$/.test(String(card.set_number ?? ''));
}

/** Order Prize Pack numbers as an appended block within Skybound. */
export function comparePrizePackNumbers(a: Partial<CatalogCard>, b: Partial<CatalogCard>): number {
  const aPrizePack = isSkyboundPrizePackPrinting(a);
  const bPrizePack = isSkyboundPrizePackPrinting(b);
  if (aPrizePack !== bPrizePack) return aPrizePack ? 1 : -1;
  if (!aPrizePack) return 0;
  return String(a.set_number).localeCompare(String(b.set_number));
}

/** Primary checklist order: set code, then collector number (unnumbered last). */
export function compareSetThenSetNumber(a: Partial<CatalogCard>, b: Partial<CatalogCard>): number {
  const setCmp = setCodeForCard(a).localeCompare(setCodeForCard(b), undefined, { sensitivity: 'base' });
  if (setCmp !== 0) return setCmp;
  const prizePackCmp = comparePrizePackNumbers(a, b);
  if (prizePackCmp !== 0) return prizePackCmp;

  const numA = parseSetNumber(a);
  const numB = parseSetNumber(b);
  if (numA !== null && numB !== null && numA !== numB) return numA - numB;
  if (numA !== null && numB === null) return -1;
  if (numA === null && numB !== null) return 1;

  return 0;
}
