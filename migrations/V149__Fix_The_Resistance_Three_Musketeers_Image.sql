-- Fix missing Three Musketeers image reference in "The Resistance" deck owned by GUEST account
-- This migration updates the selected_alternate_image column to reference the correct Three Musketeers image

UPDATE deck_cards 
SET selected_alternate_image = 'characters/three_musketeers.webp'
WHERE deck_id IN (
    SELECT d.id 
    FROM decks d 
    JOIN users u ON d.user_id = u.id 
    WHERE d.name = 'The Resistance' 
    AND u.role = 'GUEST'
)
AND card_id = '33ba33e7-f719-4cf3-bc2d-fb5887d2edad'
AND (selected_alternate_image IS NULL OR selected_alternate_image = '');
