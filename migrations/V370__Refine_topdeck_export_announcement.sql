-- Refine the existing TopDeck announcement without changing its date or artwork.
UPDATE recent_updates
SET description = 'Your decks can now be exported in TopDeck''s modern overpower format. Open a deck, choose Export, select TopDeck, and copy the decklist for Modern OverPower events.'
WHERE id = 'a1000001-0000-4000-8000-000000000013';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM recent_updates
    WHERE id = 'a1000001-0000-4000-8000-000000000013'
      AND description = 'Your decks can now be exported in TopDeck''s modern overpower format. Open a deck, choose Export, select TopDeck, and copy the decklist for Modern OverPower events.'
  ) THEN
    RAISE EXCEPTION 'TopDeck export announcement wording was not applied';
  END IF;
END $$;
