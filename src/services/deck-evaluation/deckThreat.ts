type CatalogCard = Record<string, unknown>;
interface DeckCardEntry { type: string; cardId: string; quantity: number }
import { TOURNAMENT_LEGAL_THREAT_LIMIT } from '../../constants/deckRules';

export const MAX_TOTAL_THREAT = TOURNAMENT_LEGAL_THREAT_LIMIT;

const RESERVE_THREAT_OVERRIDES: Record<string, number> = {
  'Victory Harben': 20,
  'Carson of Venus': 19,
  'Morgan le Fay': 20,
  Glenn: 16,
};

export type ThreatCatalogLookup = (
  deckType: string,
  cardId: string,
) => CatalogCard | undefined;

function characterThreatLevel(
  card: CatalogCard,
  cardId: string,
  reserveCharacterId: string | null | undefined,
): number {
  let threatLevel = Number(card.threat_level ?? 0);
  if (reserveCharacterId && cardId === reserveCharacterId) {
    const name = String(card.name ?? '');
    if (name in RESERVE_THREAT_OVERRIDES) {
      threatLevel = RESERVE_THREAT_OVERRIDES[name];
    }
  }
  return threatLevel;
}

/**
 * Portable editor-compatible total threat (including reserve overrides).
 * Mirrors v1 `calculateTotalThreat` (characters + locations only).
 */
export function calculateDeckTotalThreat(
  cards: DeckCardEntry[],
  reserveCharacterId: string | null | undefined,
  lookup: ThreatCatalogLookup,
): number {
  let totalThreat = 0;

  for (const entry of cards) {
    if (entry.type !== 'character' && entry.type !== 'location') {
      continue;
    }
    const catalogCard = lookup(entry.type, entry.cardId);
    if (!catalogCard?.threat_level) {
      continue;
    }
    const threatLevel =
      entry.type === 'character'
        ? characterThreatLevel(catalogCard, entry.cardId, reserveCharacterId)
        : Number(catalogCard.threat_level);
    totalThreat += threatLevel * entry.quantity;
  }

  return totalThreat;
}

/** Tooltip copy: show denominator when over the legal cap (never use on icon overlay). */
export function formatThreatDisplay(total: number): string {
  if (total > MAX_TOTAL_THREAT) {
    return `${total}/${MAX_TOTAL_THREAT}`;
  }
  return String(total);
}

export function formatThreatTooltip(total: number): string {
  return `Threat: ${formatThreatDisplay(total)}`;
}
