-- Add TFCP set to sets table
-- TFCP - "The Few and the Cursed - Promos"
INSERT INTO sets (code, name) VALUES
    ('TFCP', 'The Few and the Cursed - Promos');

-- Update the 7 - Combat alternate art card to TFCP universe
-- Matches by power_type, value, and image_path
UPDATE power_cards 
SET universe = 'TFCP'
WHERE power_type = 'Combat' 
  AND value = 7 
  AND image_path = 'power-cards/alternate/7_combat.png';

