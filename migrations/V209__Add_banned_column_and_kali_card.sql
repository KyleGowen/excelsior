-- Add banned column to special_cards table
-- This column marks cards that are banned from legal deck construction

ALTER TABLE special_cards
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;

-- Create index on banned column for faster queries
CREATE INDEX IF NOT EXISTS idx_special_cards_banned ON special_cards(banned);

-- Insert Kali: Goddess of War special card
-- This card is banned and marked as One Per Deck
-- Insert Kali: Goddess of War special card
-- Use gen_random_uuid() for UUID ID, or check if card already exists by name
INSERT INTO special_cards (
    id,
    name,
    character_name,
    set,
    card_effect,
    image_path,
    one_per_deck,
    cataclysm,
    ambush,
    assist,
    set_number,
    set_number_foil,
    banned
)
SELECT 
    gen_random_uuid(),
    'Kali: Goddess of War',
    'Any Character',
    'ERB',
    'Play on your turn or when Opponent concedes. Opponent may not concede. This card may be placed. If Opponent negates this card, they immediately concede the battle. One Per Deck',
    'specials/kali_goddess_of_war.webp',
    true,
    false,
    false,
    false,
    NULL,
    NULL,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM special_cards WHERE name = 'Kali: Goddess of War' AND set = 'ERB'
);

-- Update existing card if it exists (by name and set)
UPDATE special_cards
SET 
    character_name = 'Any Character',
    card_effect = 'Play on your turn or when Opponent concedes. Opponent may not concede. This card may be placed. If Opponent negates this card, they immediately concede the battle. One Per Deck',
    image_path = 'specials/kali_goddess_of_war.webp',
    one_per_deck = true,
    cataclysm = false,
    ambush = false,
    assist = false,
    set_number = NULL,
    set_number_foil = NULL,
    banned = true
WHERE name = 'Kali: Goddess of War' AND set = 'ERB';

-- Documentation
COMMENT ON COLUMN special_cards.banned IS 'Indicates if the card is banned from legal deck construction. Banned cards cause decks to be marked as illegal.';

