-- Add background_image_path column to decks table
ALTER TABLE decks
ADD COLUMN IF NOT EXISTS background_image_path VARCHAR(500);

COMMENT ON COLUMN decks.background_image_path IS 'Relative path to background image for deck editor (e.g., src/resources/cards/images/backgrounds/aesclepnotext.png). NULL means default black background.';
