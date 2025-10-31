-- Update Morgan le Fay's special ability text
-- Change from "deck-skulling" to "deck-building" and "starts in Reserve" to "starts the game in Reserve"

UPDATE characters
SET special_abilities = 'Counts as 20 points for deck-building if she starts the game in Reserve.',
    updated_at = NOW()
WHERE LOWER(name) = 'morgan le fay';

