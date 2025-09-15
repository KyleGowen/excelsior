-- Populate ally universe cards data from markdown file
-- This migration inserts all ally universe cards from the overpower-erb-universe-ally.md file

INSERT INTO ally_universe_cards (id, name, universe, card_description, stat_to_use, stat_type_to_use, attack_value, attack_type, card_text, one_per_deck, image_path, alternate_images) VALUES
('ally_universe_allan_quatermain', 'Allan Quatermain', 'ERB', 'Allan Quatermain ally card', '5 or less', 'Energy', 3, 'Energy', 'Teammate must play 1 Special card.', false, 'ally-universe/allan_quatermain.webp', ARRAY[]::text[]),
('ally_universe_hera', 'Hera', 'ERB', 'Hera ally card', '7 or higher', 'Energy', 2, 'Energy', 'Teammate must play 1 Special card.', false, 'ally-universe/hera.webp', ARRAY[]::text[]),
('ally_universe_huckleblock', 'Huckleblock', 'ERB', 'Huckleblock ally card', '5 or less', 'Brute Force', 3, 'Brute Force', 'Teammate must play 1 Special card.', false, 'ally-universe/huckleblock.webp', ARRAY[]::text[]),
('ally_universe_sir_galahad', 'Sir Galahad', 'ERB', 'Sir Galahad ally card', '7 or higher', 'Brute Force', 2, 'Brute Force', 'Teammate must play 1 Special card.', false, 'ally-universe/sir_galahad.webp', ARRAY[]::text[]),
('ally_universe_little_john', 'Little John', 'ERB', 'Little John ally card', '5 or less', 'Combat', 3, 'Combat', 'Teammate must play 1 Special card.', false, 'ally-universe/little_john.webp', ARRAY[]::text[]),
('ally_universe_guy_of_gisborne', 'Guy of Gisborne', 'ERB', 'Guy of Gisborne ally card', '7 or higher', 'Combat', 2, 'Combat', 'Teammate must play 1 Special card.', false, 'ally-universe/guy_of_gisborne.webp', ARRAY[]::text[]),
('ally_universe_professor_porter', 'Professor Porter', 'ERB', 'Professor Porter ally card', '5 or less', 'Intelligence', 3, 'Intelligence', 'Teammate must play 1 Special card.', false, 'ally-universe/professor_porter.webp', ARRAY[]::text[]),
('ally_universe_queen_guinevere', 'Queen Guinevere', 'ERB', 'Queen Guinevere ally card', '7 or higher', 'Intelligence', 2, 'Intelligence', 'Teammate must play 1 Special card.', false, 'ally-universe/queen_guinevere.webp', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  card_description = EXCLUDED.card_description,
  stat_to_use = EXCLUDED.stat_to_use,
  stat_type_to_use = EXCLUDED.stat_type_to_use,
  attack_value = EXCLUDED.attack_value,
  attack_type = EXCLUDED.attack_type,
  card_text = EXCLUDED.card_text,
  one_per_deck = EXCLUDED.one_per_deck,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
