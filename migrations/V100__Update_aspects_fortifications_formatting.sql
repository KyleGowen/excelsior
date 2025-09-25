-- Update aspects table to change **Fortifications** to "Fortifications" and ensure proper keyword order
-- This migration updates the aspect_description field to:
-- 1. Change **Fortifications** to "Fortifications" 
-- 2. Ensure **Fortifications!** appears before **One Per Deck**

UPDATE aspects 
SET aspect_description = REPLACE(
    aspect_description, 
    '**Fortifications**', 
    '"Fortifications"'
)
WHERE aspect_description LIKE '%**Fortifications**%';

-- Verify the update
SELECT name, aspect_description FROM aspects WHERE aspect_description LIKE '%"Fortifications"%';
