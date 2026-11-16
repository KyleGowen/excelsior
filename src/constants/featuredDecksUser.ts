/** The configured curated account ID is public once Featured decks is enabled. */
export function getFeaturedDecksUserId(): string | undefined {
  const id = process.env.FEATURED_DECKS_USER_ID?.trim();
  if (id && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  return undefined;
}
