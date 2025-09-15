-- Populate basic universe cards data from markdown file
-- This migration inserts all basic universe cards from the overpower-erb-universe-basic.md file

INSERT INTO basic_universe_cards (id, name, universe, type, value_to_use, bonus, one_per_deck, card_description, image_path, alternate_images) VALUES
('basic_universe_ray_gun', 'Ray Gun', 'ERB', 'Energy', '6 or greater', '+2', false, 'Ray Gun basic universe card', 'basic-universe/ray_gun.webp', ARRAY[]::text[]),
('basic_universe_merlins_wand', 'Merlin''s Wand', 'ERB', 'Energy', '6 or greater', '+3', false, 'Merlin''s Wand basic universe card', 'basic-universe/merlins_wand.webp', ARRAY[]::text[]),
('basic_universe_lightning_bolt', 'Lightning Bolt', 'ERB', 'Energy', '7 or greater', '+3', false, 'Lightning Bolt basic universe card', 'basic-universe/lightning_bolt.webp', ARRAY[]::text[]),
('basic_universe_flintlock', 'Flintlock', 'ERB', 'Combat', '6 or greater', '+2', false, 'Flintlock basic universe card', 'basic-universe/flintlock.webp', ARRAY[]::text[]),
('basic_universe_rapier', 'Rapier', 'ERB', 'Combat', '6 or greater', '+3', false, 'Rapier basic universe card', 'basic-universe/rapier.webp', ARRAY[]::text[]),
('basic_universe_longbow', 'Longbow', 'ERB', 'Combat', '7 or greater', '+3', false, 'Longbow basic universe card', 'basic-universe/longbow.webp', ARRAY[]::text[]),
('basic_universe_hydes_serum', 'Hyde''s Serum', 'ERB', 'Brute Force', '6 or greater', '+2', false, 'Hyde''s Serum basic universe card', 'basic-universe/hydes_serum.webp', ARRAY[]::text[]),
('basic_universe_trident', 'Trident', 'ERB', 'Brute Force', '6 or greater', '+3', false, 'Trident basic universe card', 'basic-universe/trident.webp', ARRAY[]::text[]),
('basic_universe_tribuchet', 'Tribuchet', 'ERB', 'Brute Force', '7 or greater', '+3', false, 'Tribuchet basic universe card', 'basic-universe/tribuchet.webp', ARRAY[]::text[]),
('basic_universe_secret_identity', 'Secret Identity', 'ERB', 'Intelligence', '6 or greater', '+2', false, 'Secret Identity basic universe card', 'basic-universe/secret_identity.webp', ARRAY[]::text[]),
('basic_universe_advanced_technology', 'Advanced Technology', 'ERB', 'Intelligence', '6 or greater', '+3', false, 'Advanced Technology basic universe card', 'basic-universe/advanced_technology.webp', ARRAY[]::text[]),
('basic_universe_magic_spell', 'Magic Spell', 'ERB', 'Intelligence', '7 or greater', '+3', false, 'Magic Spell basic universe card', 'basic-universe/magic_spell.webp', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  type = EXCLUDED.type,
  value_to_use = EXCLUDED.value_to_use,
  bonus = EXCLUDED.bonus,
  one_per_deck = EXCLUDED.one_per_deck,
  card_description = EXCLUDED.card_description,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
