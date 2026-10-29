-- V292-V294 and their later alternate printings incorrectly marked ordinary
-- level-7 promo Power cards One Per Deck. Their copy limit is the same as the
-- ERB/SKY printings, including foil and alternate art. Match stable card fields
-- rather than environment-specific UUIDs or image filenames.
-- Any-Power and Multi-Power restrictions are deliberately outside this repair.
UPDATE power_cards
SET one_per_deck = FALSE,
    updated_at = NOW()
WHERE value = 7
  AND power_type IN ('Energy', 'Combat', 'Brute Force', 'Intelligence')
  AND one_per_deck IS DISTINCT FROM FALSE;
