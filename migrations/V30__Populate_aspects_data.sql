-- Populate aspects data from markdown file
-- This migration inserts all aspect cards from the overpower-erb-aspects.md file

INSERT INTO aspects (id, name, universe, location, aspect_description, one_per_deck, fortifications, image_path, alternate_images) VALUES
('aspect_amaru_dragon_legend', 'Amaru: Dragon Legend', 'ERB', 'Any Homebase', '**Fortifications!** Homebase makes a level 4 Energy attack. Any Front Line Character may make 1 additional attack. May only have 1 **Fortifications** card per deck. **One Per Deck**', true, true, 'aspects/amaru_dragon_legend.webp', ARRAY[]::text[]),
('aspect_mallku', 'Mallku', 'ERB', 'Any Homebase', '**Fortifications!** Homebase makes a level 4 Combat attack. Any Front Line Character may make 1 additional attack. May only have 1 **Fortifications** card per deck. **One Per Deck**', true, true, 'aspects/mallku.webp', ARRAY[]::text[]),
('aspect_supay', 'Supay', 'ERB', 'Any Homebase', '**Fortifications!** Homebase makes a level 4 Brute Force attack. Any Front Line Character may make 1 additional attack. May only have 1 **Fortifications** card per deck. **One Per Deck**', true, true, 'aspects/supay.webp', ARRAY[]::text[]),
('aspect_cheshire_cat', 'Cheshire Cat', 'ERB', 'Any Homebase', '**Fortifications!** Homebase makes a level 4 Intelligence attack. Any Front Line Character may make 1 additional attack. May only have 1 **Fortifications** card per deck. **One Per Deck**', true, true, 'aspects/cheshire_cat.webp', ARRAY[]::text[]),
('aspect_isis', 'Isis', 'ERB', 'Any Homebase', '**Fortifications!** Homebase makes a level 2 MultiPower attack. Any Front Line Character may make 1 additional attack. May only have 1 **Fortifications** card per deck. **One Per Deck**', true, true, 'aspects/isis.webp', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  location = EXCLUDED.location,
  aspect_description = EXCLUDED.aspect_description,
  one_per_deck = EXCLUDED.one_per_deck,
  fortifications = EXCLUDED.fortifications,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
