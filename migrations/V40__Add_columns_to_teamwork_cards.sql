-- Add columns to teamwork_cards table for detailed card information
ALTER TABLE teamwork_cards
ADD COLUMN to_use VARCHAR(255),
ADD COLUMN acts_as VARCHAR(255),
ADD COLUMN followup_attack_types VARCHAR(255),
ADD COLUMN first_attack_bonus VARCHAR(255),
ADD COLUMN second_attack_bonus VARCHAR(255);

-- Create index on to_use for filtering
CREATE INDEX idx_teamwork_to_use ON teamwork_cards(to_use);
