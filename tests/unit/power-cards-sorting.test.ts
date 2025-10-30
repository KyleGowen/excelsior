/**
 * @jest-environment jsdom
 */

describe('Power Cards Sorting', () => {
  const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Multi Power', 'Any-Power'];
  const orderIndex = (t: string) => {
    const idx = preferredOrder.indexOf(t);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  function sortByValueThenOPType(cards: Array<{ value: number; power_type: string }>) {
    return [...cards].sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value;
      return orderIndex(a.power_type) - orderIndex(b.power_type);
    });
  }

  test('sorts by ascending value', () => {
    const input = [
      { value: 6, power_type: 'Combat' },
      { value: 3, power_type: 'Energy' },
      { value: 5, power_type: 'Brute Force' }
    ];
    const out = sortByValueThenOPType(input).map(c => c.value);
    expect(out).toEqual([3, 5, 6]);
  });

  test('ties use Overpower type order', () => {
    const input = [
      { value: 6, power_type: 'Intelligence' },
      { value: 6, power_type: 'Brute Force' },
      { value: 6, power_type: 'Combat' },
      { value: 6, power_type: 'Energy' },
      { value: 6, power_type: 'Multi Power' },
      { value: 6, power_type: 'Any-Power' }
    ];
    const out = sortByValueThenOPType(input).map(c => c.power_type);
    expect(out).toEqual(['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Multi Power', 'Any-Power']);
  });

  test('unknown types come after known OP types when tied', () => {
    const input = [
      { value: 4, power_type: 'Unknown-X' },
      { value: 4, power_type: 'Combat' }
    ];
    const out = sortByValueThenOPType(input).map(c => c.power_type);
    expect(out).toEqual(['Combat', 'Unknown-X']);
  });
});


