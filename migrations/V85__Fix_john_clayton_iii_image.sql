-- Fix John Clayton III special card image path
-- The file exists as john_clayton_lll.webp but the database has john_clayton_iii.webp
UPDATE special_cards SET image_path = 'specials/john_clayton_lll.webp' WHERE name = 'John Clayton III';
