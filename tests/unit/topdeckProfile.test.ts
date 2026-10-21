import { parseTopDeckHandle, topdeckProfileUrl } from '../../src/utils/topdeckProfile';
import { topdeckProfileUrl as frontendUrl } from '../../frontend/src/lib/auth/topdeckProfile';

describe('TopDeck profile handles', () => {
  it.each([
    ['  @Example_Player-1.2  ', 'Example_Player-1.2'],
    ['Example', 'Example'], ['日本語', '日本語'], ['', null], ['   ', null], [null, null],
  ])('normalizes %p without inferring an account', (raw, expected) => {
    expect(parseTopDeckHandle(raw)).toEqual({ ok: true, value: expected });
  });
  it.each([undefined, 123, {}, [], '@', '@@name', 'two words', 'a/b', 'a\\b', 'a?x=y', 'a#x',
    'https://topdeck.gg/profile/@name', 'javascript:alert(1)', '<script>', 'a\u0000b', 'x'.repeat(256)])(
    'rejects unsafe or malformed input %p', raw => expect(parseTopDeckHandle(raw).ok).toBe(false)
  );
  it('accepts the application storage limit', () => {
    expect(parseTopDeckHandle('x'.repeat(255)).ok).toBe(true);
  });
  it.each([topdeckProfileUrl, frontendUrl])('uses a fixed host and safely encodes the path', build => {
    expect(build(null)).toBeNull();
    expect(build(undefined)).toBeNull();
    expect(build('')).toBeNull();
    expect(build('Example')).toBe('https://topdeck.gg/profile/@Example');
    expect(build('日本語')).toBe('https://topdeck.gg/profile/@%E6%97%A5%E6%9C%AC%E8%AA%9E');
    expect(new URL(build('a/b?x#y')!).hostname).toBe('topdeck.gg');
    expect(build('a/b?x#y')).toContain('a%2Fb%3Fx%23y');
  });
});
