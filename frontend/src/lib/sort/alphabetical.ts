const ALPHABETICAL_COMPARE_OPTIONS: Intl.CollatorOptions = {
  sensitivity: 'base',
};

/**
 * Build the filing-style key used for user-facing alphabetical sorts.
 *
 * A leading article stays in the displayed value, but moves to the end of the
 * comparison key: "The Immortal" is compared as "Immortal, The".
 */
export function alphabeticalSortKey(value: unknown): string {
  const text = String(value ?? '').trim();
  const match = text.match(/^the\s+(.+)$/i);
  return match ? `${match[1].trim()}, The` : text;
}

/** Compare user-facing text A-Z while disregarding a leading "The ". */
export function compareAlphabetically(a: unknown, b: unknown): number {
  const aText = String(a ?? '').trim();
  const bText = String(b ?? '').trim();
  const keyCmp = alphabeticalSortKey(aText).localeCompare(
    alphabeticalSortKey(bText),
    undefined,
    ALPHABETICAL_COMPARE_OPTIONS,
  );
  if (keyCmp !== 0) return keyCmp;

  return aText.localeCompare(bText, undefined, ALPHABETICAL_COMPARE_OPTIONS);
}
