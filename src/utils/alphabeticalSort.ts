const ALPHABETICAL_COMPARE_OPTIONS: Intl.CollatorOptions = {
  sensitivity: 'base',
};

/** Build a filing key that moves a leading "The " after the displayed name. */
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
