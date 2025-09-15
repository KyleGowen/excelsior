-- Add columns to training_cards table for detailed card information
ALTER TABLE training_cards
ADD COLUMN type_1 VARCHAR(255),
ADD COLUMN type_2 VARCHAR(255),
ADD COLUMN value_to_use VARCHAR(255),
ADD COLUMN bonus VARCHAR(255);

-- Create index on type_1 for filtering
CREATE INDEX idx_training_type_1 ON training_cards(type_1);

-- Create index on type_2 for filtering
CREATE INDEX idx_training_type_2 ON training_cards(type_2);
