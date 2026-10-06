import {
  computeReserveRowState,
  reserveSlotVisible,
} from '../../frontend/src/lib/decks/reserveCharacter';
import {
  calculateDeckTotalThreat,
  formatThreatDisplay,
  formatThreatTooltip,
  MAX_TOTAL_THREAT,
} from '../../src/services/deck-preview/../deck-evaluation/deckThreat';
import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';

const chars = [
  { cardId: 'char-a' },
  { cardId: 'char-b' },
];

describe('computeReserveRowState', () => {
  it('returns none when no reserve is set', () => {
    expect(computeReserveRowState('char-a', null, chars, false)).toBe('none');
    expect(computeReserveRowState('char-b', null, chars, false)).toBe('none');
  });

  it('returns active on the reserved character', () => {
    expect(computeReserveRowState('char-a', 'char-a', chars, false)).toBe('active');
  });

  it('returns hidden on non-reserve characters when reserve matches deck', () => {
    expect(computeReserveRowState('char-b', 'char-a', chars, false)).toBe('hidden');
  });

  it('returns orphaned on all characters when reserve id is not in deck', () => {
    expect(computeReserveRowState('char-a', 'char-missing', chars, false)).toBe('orphaned');
    expect(computeReserveRowState('char-b', 'char-missing', chars, false)).toBe('orphaned');
  });

  it('returns readonlyActive only on reserved character in read-only mode', () => {
    expect(computeReserveRowState('char-a', 'char-a', chars, true)).toBe('readonlyActive');
    expect(computeReserveRowState('char-b', 'char-a', chars, true)).toBe('readonlyHidden');
  });

  it('returns readonlyHidden when read-only and no reserve', () => {
    expect(computeReserveRowState('char-a', null, chars, true)).toBe('readonlyHidden');
  });
});

describe('reserveSlotVisible', () => {
  it('hides slot only in readonlyHidden state', () => {
    expect(reserveSlotVisible('none')).toBe(true);
    expect(reserveSlotVisible('hidden')).toBe(true);
    expect(reserveSlotVisible('readonlyActive')).toBe(true);
    expect(reserveSlotVisible('readonlyHidden')).toBe(false);
  });
});

describe('calculateDeckTotalThreat', () => {
  const victoryHarben: CatalogCard = {
    id: 'vh-1',
    name: 'Victory Harben',
    threat_level: 18,
  };
  const carson: CatalogCard = {
    id: 'cv-1',
    name: 'Carson of Venus',
    threat_level: 18,
  };
  const glenn: CatalogCard = {
    id: 'glenn-1',
    name: 'Glenn',
    threat_level: 15,
  };
  const generic: CatalogCard = {
    id: 'gen-1',
    name: 'Generic Hero',
    threat_level: 19,
  };
  const location: CatalogCard = {
    id: 'loc-1',
    name: 'Some Location',
    threat_level: 2,
  };

  const lookup = (deckType: string, cardId: string): CatalogCard | undefined => {
    const map: Record<string, CatalogCard> = {
      'character:vh-1': victoryHarben,
      'character:cv-1': carson,
      'character:glenn-1': glenn,
      'character:gen-1': generic,
      'location:loc-1': location,
    };
    return map[`${deckType}:${cardId}`];
  };

  const cards: DeckCardEntry[] = [
    { type: 'character', cardId: 'vh-1', quantity: 1 },
    { type: 'character', cardId: 'gen-1', quantity: 1 },
    { type: 'location', cardId: 'loc-1', quantity: 1 },
  ];

  it('sums character and location threat without reserve', () => {
    expect(calculateDeckTotalThreat(cards, null, lookup)).toBe(18 + 19 + 2);
  });

  it('applies Victory Harben reserve bump to 20', () => {
    expect(calculateDeckTotalThreat(cards, 'vh-1', lookup)).toBe(20 + 19 + 2);
  });

  it('applies Carson of Venus reserve bump to 19', () => {
    const carsonCards: DeckCardEntry[] = [
      { type: 'character', cardId: 'cv-1', quantity: 1 },
    ];
    expect(calculateDeckTotalThreat(carsonCards, 'cv-1', lookup)).toBe(19);
  });

  it('applies Glenn reserve bump to 16', () => {
    const glennCards: DeckCardEntry[] = [
      { type: 'character', cardId: 'glenn-1', quantity: 1 },
    ];
    expect(calculateDeckTotalThreat(glennCards, 'glenn-1', lookup)).toBe(16);
  });
});

describe('formatThreatDisplay', () => {
  it('returns plain total at or below cap', () => {
    expect(formatThreatDisplay(60)).toBe('60');
    expect(formatThreatDisplay(MAX_TOTAL_THREAT)).toBe(String(MAX_TOTAL_THREAT));
  });

  it('shows denominator when over cap', () => {
    expect(formatThreatDisplay(77)).toBe(`77/${MAX_TOTAL_THREAT}`);
  });
});

describe('formatThreatTooltip', () => {
  it('uses plain total at or below cap', () => {
    expect(formatThreatTooltip(60)).toBe('Threat: 60');
    expect(formatThreatTooltip(MAX_TOTAL_THREAT)).toBe(`Threat: ${MAX_TOTAL_THREAT}`);
  });

  it('includes denominator when over cap', () => {
    expect(formatThreatTooltip(79)).toBe(`Threat: 79/${MAX_TOTAL_THREAT}`);
  });
});
