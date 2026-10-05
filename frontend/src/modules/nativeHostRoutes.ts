/** Fictional development host only. Modules do not assume this prefix or router. */
export const NATIVE_HOST_BASE = '/fictional-host';
export const PUBLIC_FIXTURE_DECK = 'b4ec3a04-ab17-4a33-b813-df35f8195d75';
export function nativeDeckPath(id: string): string | null {
 // Guest identifiers encode session identity; never put them into fixture URLs.
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? `/tools/decks/${id}` : null;
}
