-- Fix The Gemini alternate image
-- This migration adds the missing alternate image for The Gemini special card

UPDATE special_cards 
SET alternate_images = '{the_gemini.webp}' 
WHERE name = 'The Gemini';
