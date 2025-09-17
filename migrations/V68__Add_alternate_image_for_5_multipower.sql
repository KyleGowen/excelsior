-- Add alternate image for 5 - Multi Power card

UPDATE power_cards 
SET alternate_images = ARRAY['power-cards/alternate/5_multipower.webp']
WHERE name = '5 - Multi Power' AND power_type = 'Multi Power';
