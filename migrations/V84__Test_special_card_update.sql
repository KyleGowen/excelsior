-- Test migration to update one special card
UPDATE special_cards SET image_path = 'specials/gunnr.webp' WHERE name = 'Gunnr: Battle Valkyrie';
