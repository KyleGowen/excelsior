-- Update the 7 - Any-Power alternate art card to SKY set
-- Matches by power_type, value, and image_path
UPDATE power_cards 
SET set = 'SKY'
WHERE power_type = 'Any-Power' 
  AND value = 7 
  AND image_path = 'power-cards/alternate/7_anypower.png';

