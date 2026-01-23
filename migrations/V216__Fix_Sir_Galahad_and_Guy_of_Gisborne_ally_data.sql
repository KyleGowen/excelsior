-- Correct swapped Ally Universe rows for Sir Galahad and Guy of Gisborne.
--
-- The underlying card numbers / images indicate:
-- - ally-universe/7_combat.webp is Sir Galahad (card #327)
-- - ally-universe/7_brute_force.webp is Guy of Gisborne (card #329)
--
-- Some environments have these two rows swapped (names attached to the other row's id/set_number).
-- This migration MUST work across environments where UUIDs differ, so it corrects by stable signals:
-- - preferred: set_number (card number)
-- - fallback: current image_path filename (including older per-card filenames)

UPDATE ally_universe_cards
SET
  name = CASE
    WHEN set_number IN ('327') OR set_number_foil IN ('327') OR image_path IN ('ally-universe/7_combat.webp', 'ally-universe/sir_galahad.webp') THEN 'Sir Galahad'
    WHEN set_number IN ('329') OR set_number_foil IN ('329') OR image_path IN ('ally-universe/7_brute_force.webp', 'ally-universe/guy_of_gisborne.webp') THEN 'Guy of Gisborne'
    ELSE name
  END,
  card_description = CASE
    WHEN set_number IN ('327') OR set_number_foil IN ('327') OR image_path IN ('ally-universe/7_combat.webp', 'ally-universe/sir_galahad.webp') THEN 'Sir Galahad ally card'
    WHEN set_number IN ('329') OR set_number_foil IN ('329') OR image_path IN ('ally-universe/7_brute_force.webp', 'ally-universe/guy_of_gisborne.webp') THEN 'Guy of Gisborne ally card'
    ELSE card_description
  END,
  image_path = CASE
    WHEN set_number IN ('327') OR set_number_foil IN ('327') OR image_path IN ('ally-universe/7_combat.webp', 'ally-universe/sir_galahad.webp') THEN 'ally-universe/7_combat.webp'
    WHEN set_number IN ('329') OR set_number_foil IN ('329') OR image_path IN ('ally-universe/7_brute_force.webp', 'ally-universe/guy_of_gisborne.webp') THEN 'ally-universe/7_brute_force.webp'
    ELSE image_path
  END,
  stat_type_to_use = CASE
    WHEN set_number IN ('327') OR set_number_foil IN ('327') OR image_path IN ('ally-universe/7_combat.webp', 'ally-universe/sir_galahad.webp') THEN 'Combat'
    WHEN set_number IN ('329') OR set_number_foil IN ('329') OR image_path IN ('ally-universe/7_brute_force.webp', 'ally-universe/guy_of_gisborne.webp') THEN 'Brute Force'
    ELSE stat_type_to_use
  END,
  attack_type = CASE
    WHEN set_number IN ('327') OR set_number_foil IN ('327') OR image_path IN ('ally-universe/7_combat.webp', 'ally-universe/sir_galahad.webp') THEN 'Combat'
    WHEN set_number IN ('329') OR set_number_foil IN ('329') OR image_path IN ('ally-universe/7_brute_force.webp', 'ally-universe/guy_of_gisborne.webp') THEN 'Brute Force'
    ELSE attack_type
  END
WHERE set = 'ERB'
  AND (
    set_number IN ('327', '329')
    OR set_number_foil IN ('327', '329')
    OR image_path IN (
      'ally-universe/7_combat.webp',
      'ally-universe/7_brute_force.webp',
      'ally-universe/sir_galahad.webp',
      'ally-universe/guy_of_gisborne.webp'
    )
    OR name IN ('Sir Galahad', 'Guy of Gisborne')
  );

