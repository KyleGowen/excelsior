-- Populate advanced universe cards data from markdown file
-- This migration inserts all advanced universe cards from the overpower-erb-advanced-universe.md file

INSERT INTO advanced_universe_cards (id, name, universe, character, card_description, image_path, alternate_images, one_per_deck) VALUES
('advanced_universe_shards_of_the_staff', 'Shards of the Staff', 'ERB', 'Ra', 'Ra''s team''s Power cards are +2 to defense for remainder of game. **One Per Deck**', 'advanced-universe/shards_of_the_staff.webp', ARRAY[]::text[], true),
('advanced_universe_staff_fragments', 'Staff Fragments', 'ERB', 'Ra', 'For remainder of game, during the Venture Phase, Ra may discard 2 cards from the top of Draw Pile into Dead Pile, to venture 3 Mission cards with no penalty. **One Per Deck**', 'advanced-universe/staff_fragments.webp', ARRAY[]::text[], true),
('advanced_universe_staff_head', 'Staff Head', 'ERB', 'Ra', 'For remainder of game, during Discard Phase, after discarding 1 or more duplicate or unusable cards, sort through Power Pack and choose any 1 card and place it in hand. May not be duplicate. **One Per Deck**', 'advanced-universe/staff_head.webp', ARRAY[]::text[], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  character = EXCLUDED.character,
  card_description = EXCLUDED.card_description,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;
