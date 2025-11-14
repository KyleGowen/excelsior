-- Add set_number and set_number_foil columns to all card tables
-- Both columns are VARCHAR(8) and nullable

-- Characters table
ALTER TABLE characters 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Special cards table
ALTER TABLE special_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Power cards table
ALTER TABLE power_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Missions table
ALTER TABLE missions 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Events table
ALTER TABLE events 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Aspects table
ALTER TABLE aspects 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Advanced universe cards table
ALTER TABLE advanced_universe_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Teamwork cards table
ALTER TABLE teamwork_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Ally universe cards table
ALTER TABLE ally_universe_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Training cards table
ALTER TABLE training_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Basic universe cards table
ALTER TABLE basic_universe_cards 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

-- Locations table
ALTER TABLE locations 
ADD COLUMN set_number VARCHAR(8),
ADD COLUMN set_number_foil VARCHAR(8);

