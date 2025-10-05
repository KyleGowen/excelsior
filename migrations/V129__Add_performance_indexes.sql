-- V129: Add performance indexes for better query performance
-- This migration adds composite indexes and missing indexes for frequently queried columns

-- Add composite index for deck_cards lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_type_id ON deck_cards(deck_id, card_type, card_id);

-- Add index for deck_cards quantity queries
CREATE INDEX IF NOT EXISTS idx_deck_cards_quantity ON deck_cards(quantity) WHERE quantity > 0;

-- Add index for users role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add index for decks by user and creation time (for user deck listings)
CREATE INDEX IF NOT EXISTS idx_decks_user_created ON decks(user_id, created_at DESC);

-- Add index for decks by name (for search functionality)
CREATE INDEX IF NOT EXISTS idx_decks_name_lower ON decks(LOWER(name));

-- Add index for characters by universe and name (for filtering)
CREATE INDEX IF NOT EXISTS idx_characters_universe_name ON characters(universe, name);

-- Add index for special_cards by character and one_per_deck (for deck building)
CREATE INDEX IF NOT EXISTS idx_special_cards_character_one_per ON special_cards(character_name, one_per_deck);

-- Add index for power_cards by type and value (for deck building)
CREATE INDEX IF NOT EXISTS idx_power_cards_type_value ON power_cards(power_type, value);

-- Add index for locations by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_locations_universe_name ON locations(universe, name);

-- Add index for missions by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_missions_universe_name ON missions(universe, name);

-- Add index for events by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_events_universe_name ON events(universe, name);

-- Add index for aspects by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_aspects_universe_name ON aspects(universe, name);

-- Add index for advanced_universe_cards by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_advanced_universe_cards_universe_name ON advanced_universe_cards(universe, name);

-- Add index for teamwork_cards by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_teamwork_cards_universe_name ON teamwork_cards(universe, name);

-- Add index for ally_universe_cards by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_ally_universe_cards_universe_name ON ally_universe_cards(universe, name);

-- Add index for training_cards by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_training_cards_universe_name ON training_cards(universe, name);

-- Add index for basic_universe_cards by universe (for filtering)
CREATE INDEX IF NOT EXISTS idx_basic_universe_cards_universe_name ON basic_universe_cards(universe, name);

-- Add index for power_cards by one_per_deck (for deck building)
CREATE INDEX IF NOT EXISTS idx_power_cards_one_per_deck ON power_cards(one_per_deck);

-- Add index for special_cards by one_per_deck (for deck building)
CREATE INDEX IF NOT EXISTS idx_special_cards_one_per_deck ON special_cards(one_per_deck);

-- Add index for deck_cards by card_type and card_id (for card usage tracking)
CREATE INDEX IF NOT EXISTS idx_deck_cards_type_id ON deck_cards(card_type, card_id);

-- Add index for users by created_at (for admin queries)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add index for decks by updated_at (for recent activity)
CREATE INDEX IF NOT EXISTS idx_decks_updated_at ON decks(updated_at DESC);
