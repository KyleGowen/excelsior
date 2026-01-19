/**
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';

function loadAlphabetizationScript() {
  const scriptPath = path.join(__dirname, '../../public/js/alphabetization.js');
  const code = fs.readFileSync(scriptPath, 'utf8');
  // Execute in window context (script attaches to window.Alphabetization)
  new Function(code)();
  return (window as any).Alphabetization;
}

describe('Alphabetization (global frontend scheme)', () => {
  const originalIntl = (global as any).Intl;

  afterEach(() => {
    // Cleanup globals between tests
    delete (window as any).Alphabetization;
    (global as any).Intl = originalIntl;
  });

  it('exposes the expected API on window', () => {
    const Alphabetization = loadAlphabetizationScript();
    expect(Alphabetization).toBeDefined();
    expect(typeof Alphabetization.compare).toBe('function');
    expect(typeof Alphabetization.compareCaseInsensitive).toBe('function');
    expect(typeof Alphabetization.configure).toBe('function');
    expect(Alphabetization.settings).toBeDefined();
  });

  it('is case-sensitive and accent-insensitive (Intl.Collator sensitivity: "case")', () => {
    const Alphabetization = loadAlphabetizationScript();

    // Accent-insensitive: é and e should compare equal at sensitivity "case"
    expect(Alphabetization.compare('café', 'cafe')).toBe(0);

    // Case-sensitive: "a" and "A" should not compare equal
    expect(Alphabetization.compare('a', 'A')).not.toBe(0);
  });

  it('ignores a leading "The " when sorting (case-insensitive match), without altering display strings', () => {
    const Alphabetization = loadAlphabetizationScript();

    // "The Mummy" should sort by "Mummy"
    expect(Alphabetization.compare('The Mummy', 'Zebra')).toBeLessThan(0);
    expect(Alphabetization.compare('The Mummy', 'Apple')).toBeGreaterThan(0);

    // Case-insensitive match for the article
    expect(Alphabetization.compare('tHe Mummy', 'Zebra')).toBeLessThan(0);

    // "The Three Musketeers" should sort using "Three"
    expect(Alphabetization.compare('The Three Musketeers', 'The Mummy')).toBeGreaterThan(0);

    // Tie-breaker: if sort keys are equal, compare should not return 0
    // (otherwise stable ordering would be unpredictable).
    expect(Alphabetization.compare('The Mummy', 'Mummy')).not.toBe(0);
  });

  it('normalizes whitespace when building sort keys', () => {
    const Alphabetization = loadAlphabetizationScript();

    // Same effective sort key: "The   Mummy" -> "Mummy"
    const a = '  The   Mummy ';
    const b = 'The Mummy';
    // Keys equal, so compare falls back to original string tie-breaker; it should still be deterministic.
    expect(typeof Alphabetization.compare(a, b)).toBe('number');

    // Both should still sort before Zebra since key is "Mummy"
    expect(Alphabetization.compare(a, 'Zebra')).toBeLessThan(0);
    expect(Alphabetization.compare(b, 'Zebra')).toBeLessThan(0);
  });

  it('configure() merges options/locale and rebuilds collator (smoke test)', () => {
    const Alphabetization = loadAlphabetizationScript();

    // Should be safe on bad input
    expect(() => Alphabetization.configure(null)).not.toThrow();
    expect(() => Alphabetization.configure(undefined)).not.toThrow();
    expect(() => Alphabetization.configure('nope')).not.toThrow();

    // Locale + options merge
    Alphabetization.configure({
      locale: 'en',
      options: { numeric: true }
    });

    expect(Alphabetization.settings.locale).toBe('en');
    expect(Alphabetization.settings.options.numeric).toBe(true);
    // Keep existing sensitivity unless changed
    expect(Alphabetization.settings.options.sensitivity).toBe('case');
  });

  it('supports changing ignored articles by mutating settings (smoke test)', () => {
    const Alphabetization = loadAlphabetizationScript();

    // Default ignores "The"
    expect(Alphabetization.compare('The Mummy', 'Apple')).toBeGreaterThan(0);

    // Stop ignoring "The" => now sorts under "T" (so it should be < "Zebra")
    Alphabetization.settings.ignoreLeadingArticles = [];
    expect(Alphabetization.compare('The Mummy', 'Zebra')).toBeLessThan(0);
  });

  it('falls back gracefully when Intl.Collator is unavailable', () => {
    // Remove Intl so rebuildCollator sets collator = null
    (global as any).Intl = undefined;

    const Alphabetization = loadAlphabetizationScript();

    // Basic comparator should still work (string localeCompare fallback)
    expect(Alphabetization.compare('b', 'a')).toBeGreaterThan(0);
    expect(Alphabetization.compare('The Mummy', 'Zebra')).toBeLessThan(0);
  });

  it('falls back gracefully when Intl.Collator construction throws', () => {
    (global as any).Intl = {
      Collator: function Collator() {
        throw new Error('boom');
      }
    };

    const Alphabetization = loadAlphabetizationScript();
    expect(Alphabetization.compare('b', 'a')).toBeGreaterThan(0);
  });
});

