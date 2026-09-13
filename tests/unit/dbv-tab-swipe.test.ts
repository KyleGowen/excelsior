import {
  ANY_CHARACTER_SPECIALS_TAB,
  COLLECTION_TAB_ORDER,
  DBV_TAB_ORDER,
} from '../../frontend/src/lib/catalog/catalogTypeMap';
import { stepCyclicalIndex } from '../../frontend/src/lib/layout/cyclicalIndex';

function tabAfterSwipe(tab: (typeof DBV_TAB_ORDER)[number], delta: 1 | -1) {
  const idx = DBV_TAB_ORDER.indexOf(tab);
  return DBV_TAB_ORDER[stepCyclicalIndex(idx >= 0 ? idx : 0, DBV_TAB_ORDER.length, delta)];
}

describe('DBV_TAB_ORDER', () => {
  it('lists All first and inserts Any Character after Special Cards', () => {
    expect(DBV_TAB_ORDER).toHaveLength(15);
    expect(DBV_TAB_ORDER[0]).toBe('all');
    expect(DBV_TAB_ORDER[14]).toBe('basic-universe');
    expect(DBV_TAB_ORDER[1]).toBe('characters');
    expect(DBV_TAB_ORDER).toContain('battlegrounds');
  });
});

describe('DBV mobile tab swipe cycling', () => {
  it('swipe right from All wraps to Basic', () => {
    expect(tabAfterSwipe('all', -1)).toBe('basic-universe');
  });

  it('swipe left from Basic wraps to All', () => {
    expect(tabAfterSwipe('basic-universe', 1)).toBe('all');
  });

  it('swipe left from Characters goes to Special Cards', () => {
    expect(tabAfterSwipe('characters', 1)).toBe('special-cards');
  });

  it('swipe left from Special Cards goes to Any Character', () => {
    expect(tabAfterSwipe('special-cards', 1)).toBe(ANY_CHARACTER_SPECIALS_TAB);
  });

  it('swipe left from All goes to Characters', () => {
    expect(tabAfterSwipe('all', 1)).toBe('characters');
  });
});

describe('Collection mobile tab swipe cycling', () => {
  it('keeps catalog-only cyclical tab order', () => {
    expect(COLLECTION_TAB_ORDER).toHaveLength(14);
    expect(COLLECTION_TAB_ORDER).not.toContain(ANY_CHARACTER_SPECIALS_TAB);
  });
});
