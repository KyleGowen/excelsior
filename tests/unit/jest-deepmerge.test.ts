import merge from 'deepmerge';

describe('Jest configuration merge adapter', () => {
  it('merges nested configuration and concatenates arrays without mutating inputs', () => {
    const target = { globals: { enabled: true }, roots: ['src'] };
    const source = { globals: { timeout: 10 }, roots: ['tests'] };
    expect(merge.all<Record<string, unknown>>([target, source])).toEqual({
      globals: { enabled: true, timeout: 10 }, roots: ['src', 'tests'],
    });
    expect(target).toEqual({ globals: { enabled: true }, roots: ['src'] });
    expect(source).toEqual({ globals: { timeout: 10 }, roots: ['tests'] });
  });

  it('preserves functions, regular expressions, and enumerable symbol keys', () => {
    const key = Symbol('config');
    const transform = () => 'value';
    const pattern = /test/;
    const result = merge({}, { transform, pattern, [key]: { enabled: true } });
    expect(result).toEqual({ transform, pattern, [key]: { enabled: true } });
  });

  it('rejects prototype poisoning even when the target has a null prototype', () => {
    const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"safe":1}') as Record<string, unknown>;
    const target = Object.create(null) as Record<string, unknown>;
    const result = merge(target, payload);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(result.safe).toBe(1);
  });
});
