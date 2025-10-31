-- Fix icons/value for Billy the Kid's "I'll Make You Famous"
-- Should have Combat and Brute Force icons at value 5

UPDATE special_cards
SET icons = ARRAY['Combat','Brute Force'],
    value = 5,
    updated_at = NOW()
WHERE name = 'I''ll Make You Famous'
  AND character_name = 'Billy the Kid';


