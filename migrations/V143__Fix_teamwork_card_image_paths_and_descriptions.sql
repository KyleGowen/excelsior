-- Fix teamwork card image paths and descriptions
-- This migration corrects the image paths for teamwork cards and fixes one description

-- Update teamwork card image paths based on the corrected mappings
-- Note: The cards are in the 'ERB' universe, not 'teamwork-universe'

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_combat_0e_1bf.webp'
WHERE name = '6 Combat' 
AND card_description = 'Teamwork card: 6 Combat acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_combat_0e_1i.webp'
WHERE name = '6 Combat' 
AND card_description = 'Teamwork card: 6 Combat acts as 4 Attack with Energy + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_energy_0c_1i.webp'
WHERE name = '6 Energy' 
AND card_description = 'Teamwork card: 6 Energy acts as 4 Attack with Combat + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_energy_0c_1bf.webp'
WHERE name = '6 Energy' 
AND card_description = 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_intelligence_0c_1bf.webp'
WHERE name = '6 Intelligence' 
AND card_description = 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_intelligence_0e_1c.webp'
WHERE name = '6 Intelligence' 
AND card_description = 'Teamwork card: 6 Intelligence acts as 4 Attack with Combat + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_combat_1e_1i.webp'
WHERE name = '7 Combat' 
AND card_description = 'Teamwork card: 7 Combat acts as 4 Attack with Energy + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_combat_1e_1bf.webp'
WHERE name = '7 Combat' 
AND card_description = 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_energy_1c_1bf.webp'
WHERE name = '7 Energy' 
AND card_description = 'Teamwork card: 7 Energy acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_energy_1c_1i.webp'
WHERE name = '7 Energy' 
AND card_description = 'Teamwork card: 7 Energy acts as 4 Attack with Combat + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_intelligence_1c_1bf.webp'
WHERE name = '7 Intelligence' 
AND card_description = 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_intelligence_1e_1c.webp'
WHERE name = '7 Intelligence' 
AND card_description = 'Teamwork card: 7 Intelligence acts as 4 Attack with Combat + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_brute_force_1c_2i.webp'
WHERE name = '8 Brute Force' 
AND card_description = 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_combat_1e_2bf.webp'
WHERE name = '8 Combat' 
AND card_description = 'Teamwork card: 8 Combat acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_combat_1e_2i.webp'
WHERE name = '8 Combat' 
AND card_description = 'Teamwork card: 8 Combat acts as 4 Attack with Energy + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_energy_1bf_2i.webp'
WHERE name = '8 Energy' 
AND card_description = 'Teamwork card: 8 Energy acts as 4 Attack with Intelligence + Brute Force followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_energy_1c_2bf.webp'
WHERE name = '8 Energy' 
AND card_description = 'Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_intelligence_1e_2c.webp'
WHERE name = '8 Intelligence' 
AND card_description = 'Teamwork card: 8 Intelligence acts as 4 Attack with Combat + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_intelligence_1c_2bf.webp'
WHERE name = '8 Intelligence' 
AND card_description = 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

-- Fix the specific description that was incorrect
-- The card with image path 'teamwork-universe/8_energy_1c_2bf.webp' should have description about Combat + Brute Force, not Intelligence + Brute Force
UPDATE teamwork_cards 
SET card_description = 'Teamwork card: 8 Energy acts as 4 Attack with Combat + Brute Force followup'
WHERE name = '8 Energy' 
AND image_path = 'teamwork-universe/8_energy_1c_2bf.webp'
AND universe = 'ERB';

-- Log the changes
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % teamwork card image paths and descriptions', updated_count;
END $$;
