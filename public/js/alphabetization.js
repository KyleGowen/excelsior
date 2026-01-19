// Global alphabetization scheme for the frontend.
//
// Goal: centralize "plain alphabetical" ordering so we can change it in one place.
// - Domain/special ordering rules (preferred type orders, numeric sorts, etc.) should remain local.
// - Only the general string comparison (A→Z) should use this comparator.
(function (global) {
  'use strict';

  // Single setting object to tweak alphabetization project-wide.
  // Defaults are intentionally conservative to match the previous behavior of `String#localeCompare()`
  // called with no explicit locale/options.
  const ALPHABETIZATION_SETTINGS = {
    // `undefined` => use the browser's default locale.
    locale: undefined,
    // Project preference:
    // - case-sensitive
    // - accent-insensitive
    // (Intl.Collator: sensitivity "case" => case-sensitive, diacritic-insensitive)
    options: {
      usage: 'sort',
      sensitivity: 'case',
      numeric: false,
      ignorePunctuation: false
    },
    // Ignore leading articles for alphabetization (display text remains unchanged).
    // NOTE: applies only to sorting, not searching.
    ignoreLeadingArticles: ['The']
  };

  let collator = null;

  function rebuildCollator() {
    try {
      collator = typeof Intl !== 'undefined' && Intl.Collator
        ? new Intl.Collator(ALPHABETIZATION_SETTINGS.locale, ALPHABETIZATION_SETTINGS.options)
        : null;
    } catch (_e) {
      collator = null;
    }
  }

  function normalizeToString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function buildSortKey(rawValue) {
    let s = normalizeToString(rawValue);
    if (!s) return '';

    // Normalize whitespace for stable sorting keys.
    s = s.replace(/\s+/g, ' ').trim();

    // Strip leading articles like "The " for sorting.
    const articles = Array.isArray(ALPHABETIZATION_SETTINGS.ignoreLeadingArticles)
      ? ALPHABETIZATION_SETTINGS.ignoreLeadingArticles
      : [];
    for (const article of articles) {
      const a = normalizeToString(article).trim();
      if (!a) continue;
      const re = new RegExp(`^${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i');
      if (re.test(s)) {
        s = s.replace(re, '').trim();
        break;
      }
    }

    return s;
  }

  // Core comparator for general alphabetization.
  function compare(a, b) {
    const aStr = normalizeToString(a);
    const bStr = normalizeToString(b);
    const aKey = buildSortKey(aStr);
    const bKey = buildSortKey(bStr);

    if (collator) {
      const primary = collator.compare(aKey, bKey);
      if (primary !== 0) return primary;
      // Deterministic tie-breaker: fall back to comparing the full display strings.
      return collator.compare(aStr, bStr);
    }

    // Fallback for older environments.
    const primary = aKey.localeCompare(bKey);
    if (primary !== 0) return primary;
    return aStr.localeCompare(bStr);
  }

  // Optional helper if you ever want case-insensitive alphabetical sorting
  // without changing the global setting.
  function compareCaseInsensitive(a, b) {
    const aStr = normalizeToString(a).toLowerCase();
    const bStr = normalizeToString(b).toLowerCase();
    return compare(aStr, bStr);
  }

  // Allow reconfiguration at runtime (rare, but useful for experiments / future UI setting).
  function configure(nextSettings) {
    if (!nextSettings || typeof nextSettings !== 'object') return;

    if (Object.prototype.hasOwnProperty.call(nextSettings, 'locale')) {
      ALPHABETIZATION_SETTINGS.locale = nextSettings.locale;
    }

    if (nextSettings.options && typeof nextSettings.options === 'object') {
      ALPHABETIZATION_SETTINGS.options = {
        ...ALPHABETIZATION_SETTINGS.options,
        ...nextSettings.options
      };
    }

    rebuildCollator();
  }

  rebuildCollator();

  global.Alphabetization = {
    settings: ALPHABETIZATION_SETTINGS,
    configure,
    compare,
    compareCaseInsensitive
  };
})(window);

