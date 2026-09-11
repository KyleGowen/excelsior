-- Track signup-provided sample decks by provenance so analytics can exclude them
-- even after a user renames the copy. Existing recognizable copies are backfilled
-- from the system-owned "Sample: " naming convention.
ALTER TABLE decks
ADD COLUMN is_signup_starter_copy BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE decks AS deck
SET is_signup_starter_copy = TRUE
FROM users AS owner
WHERE owner.id = deck.user_id
  AND owner.role = 'USER'
  AND deck.name LIKE 'Sample: %';

COMMENT ON COLUMN decks.is_signup_starter_copy IS
  'TRUE only for the sample deck automatically copied to a standard user during signup; used to exclude system-provided inventory from user-created deck averages.';
