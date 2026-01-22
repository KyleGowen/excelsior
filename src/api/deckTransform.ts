// Deck API response mappers
// Extracted from src/index.ts to reduce file size while preserving behavior.

export function transformDeckListItem(deck: any) {
  return {
    metadata: {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      created: deck.created_at,
      lastModified: deck.updated_at,
      cardCount: deck.card_count || 0, // Use metadata column instead of cards.length
      threat: deck.threat || 0, // Use metadata column
      is_valid: deck.is_valid || false, // Use metadata column
      userId: deck.user_id,
      uiPreferences: deck.ui_preferences,
      is_limited: deck.is_limited,
      background_image_path: deck.background_image_path || null,
    },
    cards: deck.cards || [], // Character and location cards from metadata
  };
}

export function transformDeckList(decks: any[]) {
  return decks.map(transformDeckListItem);
}

