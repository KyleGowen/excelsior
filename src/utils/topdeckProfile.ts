/** Application input rules, not a claim that TopDeck verifies the account. */
export function parseTopDeckHandle(raw: unknown):
  | { ok: true; value: string | null }
  | { ok: false; message: string } {
  if (raw === null) return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false, message: 'TopDeck handle must be text or null' };
  const value = raw.trim().replace(/^@/, '');
  if (!raw.trim()) return { ok: true, value: null };
  if (!value || value.length > 255 || !/^[\p{L}\p{N}_.-]+$/u.test(value)) {
    return { ok: false, message: 'Enter a TopDeck handle using letters, numbers, dots, underscores, or hyphens (up to 255 characters), not a URL' };
  }
  return { ok: true, value };
}

export function topdeckProfileUrl(handle: string | null | undefined): string | null {
  return handle ? `https://topdeck.gg/profile/@${encodeURIComponent(handle)}` : null;
}
