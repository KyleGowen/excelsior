-- Add per-deck mission preview selection for deck list tiles.
-- This stores the mission card UUID that should be displayed on the deck selection tile.

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS display_mission_card_id UUID NULL;

