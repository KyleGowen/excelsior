-- Fix incorrect OPD flag for Teamwork card "6 Any-Power" (ERB).
--
-- IMPORTANT: Do NOT match on `id` here. IDs may differ across environments.
-- Instead, match on the stable business fields for this card.

DO $$
DECLARE
  match_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO match_count
  FROM teamwork_cards
  WHERE name = '6 Any-Power'
    AND set = 'ERB'
    AND to_use = '6 Any-Power'
    AND acts_as = '6 Attack'
    AND followup_attack_types = 'Any-Power / Any-Power'
    AND first_attack_bonus = '0'
    AND second_attack_bonus = '0';

  IF match_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 teamwork_cards row for 6 Any-Power (ERB), found %', match_count;
  END IF;
END $$;

UPDATE teamwork_cards
SET one_per_deck = FALSE,
    updated_at = NOW()
WHERE name = '6 Any-Power'
  AND set = 'ERB'
  AND to_use = '6 Any-Power'
  AND acts_as = '6 Attack'
  AND followup_attack_types = 'Any-Power / Any-Power'
  AND first_attack_bonus = '0'
  AND second_attack_bonus = '0'
  AND one_per_deck IS TRUE;

