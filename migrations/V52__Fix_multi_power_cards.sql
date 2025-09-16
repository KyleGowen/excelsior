-- Fix multi-power cards that don't have corresponding image files
-- The actual files only go up to value 5, but database has values 6 and 7

-- Map the non-existent multi-power cards to existing ones
UPDATE power_cards SET image_path = 'power-cards/479_5_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/479_5_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 7;

