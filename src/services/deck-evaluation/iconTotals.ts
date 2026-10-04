type CatalogCard = Record<string, unknown>;
type DeckCardEntry = DeckMetricCard;

export interface DeckMetricCard { type: string; cardId: string; quantity: number; exclude_from_draw?: boolean }

const ICON_TYPES = ['Energy', 'Combat', 'Brute Force', 'Intelligence'] as const;

const ALLOWED_DECK_TYPES = new Set([
  'special',
  'aspect',
  'ally-universe',
  'ally_universe',
  'teamwork',
  'power',
]);

export interface DeckIconTotals {
  energy: number;
  combat: number;
  bruteForce: number;
  intelligence: number;
}

export interface IconCatalogFields {
  card_effect?: string;
  icons?: string[];
  power_type?: string;
  to_use?: string;
  stat_type_to_use?: string;
}

/**
 * Catalog row shape accepted by icon counting. A full `CatalogCard` carries these
 * fields at runtime, but its `unknown` index signature is not assignable to the
 * (weak) `IconCatalogFields` type, so the lookup accepts either form.
 */
export type IconCatalogSource = IconCatalogFields | CatalogCard;

export type DeckIconCardRef = Pick<DeckCardEntry, 'type' | 'cardId' | 'quantity'>;

/** Minimal deck row shape for icon counting (tests may use plain `type: string`). */
export interface DeckIconCardInput {
  type: string;
  cardId: string;
  quantity: number;
}

function iconsForCard(
  deckType: string,
  catalog: IconCatalogSource,
): string[] {
  if (deckType === 'power') {
    const type = String(catalog.power_type ?? '').trim();
    const isMulti = /multi\s*-?power/i.test(type);
    if (type === 'Any-Power') return [];
    if (isMulti) return [...ICON_TYPES];
    return ICON_TYPES.includes(type as (typeof ICON_TYPES)[number]) ? [type] : [];
  }

  if (deckType === 'teamwork') {
    const src = String(catalog.to_use ?? '');
    if (/Any-?Power/i.test(src)) return [];
    return ICON_TYPES.filter((t) => new RegExp(t, 'i').test(src));
  }

  if (deckType === 'ally-universe' || deckType === 'ally_universe') {
    const src = String(catalog.stat_type_to_use ?? '');
    const matched = ICON_TYPES.find((t) => new RegExp(t, 'i').test(src));
    return matched ? [matched] : [];
  }

  const successfulPowerHit = String(catalog.card_effect ?? '').match(
    /\bif\s+successful\b[\s\S]*?\bacts\s+as\s+(?:a\s+)?level\s+\d+\s+(Energy|Combat|Brute Force|Intelligence)\s+Power\s+card\s+hit\b/i,
  );
  if (successfulPowerHit) {
    const hitType = ICON_TYPES.find(
      (type) => type.toLowerCase() === successfulPowerHit[1].toLowerCase(),
    );
    return hitType ? [hitType] : [];
  }

  const icons = Array.isArray(catalog.icons) ? catalog.icons : [];
  return icons.filter((icon): icon is (typeof ICON_TYPES)[number] =>
    (ICON_TYPES as readonly string[]).includes(icon),
  );
}

/** Sum Energy / Combat / Brute Force / Intelligence icons from playable deck cards. */
export function calculateDeckIconTotals(
  cards: DeckIconCardInput[],
  lookup: (deckType: string, cardId: string) => IconCatalogSource | null | undefined,
): DeckIconTotals {
  const totals: DeckIconTotals = {
    energy: 0,
    combat: 0,
    bruteForce: 0,
    intelligence: 0,
  };

  cards.forEach((card) => {
    if (!ALLOWED_DECK_TYPES.has(card.type)) return;

    const catalog = lookup(card.type, card.cardId);
    if (!catalog) return;

    const quantity = card.quantity > 0 ? card.quantity : 1;
    const icons = iconsForCard(card.type, catalog);

    icons.forEach((icon) => {
      switch (icon) {
        case 'Energy':
          totals.energy += quantity;
          break;
        case 'Combat':
          totals.combat += quantity;
          break;
        case 'Brute Force':
          totals.bruteForce += quantity;
          break;
        case 'Intelligence':
          totals.intelligence += quantity;
          break;
        default:
          break;
      }
    });
  });

  return totals;
}
