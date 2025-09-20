-- Fix Sekhmet training card image path
UPDATE training_cards 
SET image_path = 'training-universe/5_any_power_5_sekhmet.webp'
WHERE name = 'Training (Sekhmet)';
