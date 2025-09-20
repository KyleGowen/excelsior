-- Fix Victory Harben special card image paths
-- Update the image paths to match the actual file names

UPDATE special_cards 
SET image_path = 'specials/abner_perrys_lab_assistant.webp'
WHERE name = 'Abner Perry''s Lab Assistant';

UPDATE special_cards 
SET image_path = 'specials/archery_knives_and_jiu_jitsu.webp'
WHERE name = 'Archery, Knives & Jiu-jitsu';

UPDATE special_cards 
SET image_path = 'specials/chamston-hedding_estate.webp'
WHERE name = 'Chamston-Hedding Estate';
