import {
  alphabeticalSortKey,
  compareAlphabetically,
} from '../../frontend/src/lib/sort/alphabetical';

describe('user-facing alphabetical sorting', () => {
  it('files a leading The after the rest of the displayed name', () => {
    expect(alphabeticalSortKey('The Immortal')).toBe('Immortal, The');
    expect(alphabeticalSortKey('the   Flaxans')).toBe('Flaxans, The');
  });

  it('sorts by the filing key without changing displayed values', () => {
    const names = ['Mauler Twins', 'The Immortal', 'Lancelot', 'The Flaxans', 'Glenn'];

    expect([...names].sort(compareAlphabetically)).toEqual([
      'The Flaxans',
      'Glenn',
      'The Immortal',
      'Lancelot',
      'Mauler Twins',
    ]);
    expect(names).toEqual(['Mauler Twins', 'The Immortal', 'Lancelot', 'The Flaxans', 'Glenn']);
  });

  it('only treats The as an article when it is a complete prefix', () => {
    expect(['Theodore', 'The Apple'].sort(compareAlphabetically)).toEqual([
      'The Apple',
      'Theodore',
    ]);
  });
});
