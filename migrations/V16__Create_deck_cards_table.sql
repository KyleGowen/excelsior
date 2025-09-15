-- Create deck_cards table (junction table for cards in decks)
CREATE TABLE deck_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    card_type VARCHAR(50) NOT NULL, -- character, special, power, mission, event, aspect, etc.
    card_id VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    selected_alternate_image VARCHAR(500), -- Path to selected alternate image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination of deck, card type, and card ID
    UNIQUE(deck_id, card_type, card_id)
);

-- Create index on deck_id for faster lookups
CREATE INDEX idx_deck_cards_deck_id ON deck_cards(deck_id);

-- Create index on card_type for filtering
CREATE INDEX idx_deck_cards_type ON deck_cards(card_type);

-- Create index on card_id for lookups
CREATE INDEX idx_deck_cards_card_id ON deck_cards(card_id);
