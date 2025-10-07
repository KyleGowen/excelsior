-- Complete teamwork card corrections based on the correct full table
-- This migration updates all teamwork cards to match the exact correct data

-- Update all teamwork card image paths and descriptions to match the correct table

-- 6 Any-Power
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_anypower.webp'
WHERE name = '6 Any-Power' 
AND universe = 'ERB';

-- 6 Brute Force cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_brute_force_0c_1i.webp'
WHERE name = '6 Brute Force' 
AND card_description = 'Teamwork card: 6 Brute Force acts as 4 Attack with Intelligence + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_brute_force_0e_1c.webp'
WHERE name = '6 Brute Force' 
AND card_description = 'Teamwork card: 6 Brute Force acts as 4 Attack with Energy + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_brute_force_0e_1i.webp'
WHERE name = '6 Brute Force' 
AND card_description = 'Teamwork card: 6 Brute Force acts as 4 Attack with Intelligence + Energy followup'
AND universe = 'ERB';

-- 6 Combat cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_combat_0bf_1i.webp'
WHERE name = '6 Combat' 
AND card_description = 'Teamwork card: 6 Combat acts as 4 Attack with Brute Force + Intelligence followup'
AND universe = 'ERB';

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

-- 6 Energy cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_energy_0b_1i.webp'
WHERE name = '6 Energy' 
AND card_description = 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_energy_0c_1bf.webp'
WHERE name = '6 Energy' 
AND card_description = 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_energy_0c_1i.webp'
WHERE name = '6 Energy' 
AND card_description = 'Teamwork card: 6 Energy acts as 4 Attack with Combat + Intelligence followup'
AND universe = 'ERB';

-- 6 Intelligence cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_intelligence_0c_1bf.webp'
WHERE name = '6 Intelligence' 
AND card_description = 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_intelligence_0e_1bf.webp'
WHERE name = '6 Intelligence' 
AND card_description = 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/6_intelligence_0e_1c.webp'
WHERE name = '6 Intelligence' 
AND card_description = 'Teamwork card: 6 Intelligence acts as 4 Attack with Combat + Energy followup'
AND universe = 'ERB';

-- 7 Any-Power
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_anypower.webp'
WHERE name = '7 Any-Power' 
AND universe = 'ERB';

-- 7 Brute Force cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_brute_force_1c_1i.webp'
WHERE name = '7 Brute Force' 
AND card_description = 'Teamwork card: 7 Brute Force acts as 4 Attack with Intelligence + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_brute_force_1e_1c.webp'
WHERE name = '7 Brute Force' 
AND card_description = 'Teamwork card: 7 Brute Force acts as 4 Attack with Energy + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_brute_force_1e_1i.webp'
WHERE name = '7 Brute Force' 
AND card_description = 'Teamwork card: 7 Brute Force acts as 4 Attack with Intelligence + Energy followup'
AND universe = 'ERB';

-- 7 Combat cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_combat_1bf_1i.webp'
WHERE name = '7 Combat' 
AND card_description = 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_combat_1e_1bf.webp'
WHERE name = '7 Combat' 
AND card_description = 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_combat_1e_1i.webp'
WHERE name = '7 Combat' 
AND card_description = 'Teamwork card: 7 Combat acts as 4 Attack with Energy + Intelligence followup'
AND universe = 'ERB';

-- 7 Energy cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_energy_1bf_1i.webp'
WHERE name = '7 Energy' 
AND card_description = 'Teamwork card: 7 Energy acts as 4 Attack with Brute Force + Intelligence followup'
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

-- 7 Intelligence cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_intelligence_1c_1bf.webp'
WHERE name = '7 Intelligence' 
AND card_description = 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_intelligence_1e_1bf.webp'
WHERE name = '7 Intelligence' 
AND card_description = 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/7_intelligence_1e_1c.webp'
WHERE name = '7 Intelligence' 
AND card_description = 'Teamwork card: 7 Intelligence acts as 4 Attack with Combat + Energy followup'
AND universe = 'ERB';

-- 8 Brute Force cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_brute_force_1c_2i.webp'
WHERE name = '8 Brute Force' 
AND card_description = 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_brute_force_1e_2c.webp'
WHERE name = '8 Brute Force' 
AND card_description = 'Teamwork card: 8 Brute Force acts as 4 Attack with Energy + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_brute_force_1e_2i.webp'
WHERE name = '8 Brute Force' 
AND card_description = 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Energy followup'
AND universe = 'ERB';

-- 8 Combat cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_combat_1bf_2i.webp'
WHERE name = '8 Combat' 
AND card_description = 'Teamwork card: 8 Combat acts as 4 Attack with Brute Force + Intelligence followup'
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

-- 8 Energy cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_energy_1bf_2i.webp'
WHERE name = '8 Energy' 
AND card_description = 'Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Intelligence followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_energy_1c_2bf.webp'
WHERE name = '8 Energy' 
AND card_description = 'Teamwork card: 8 Energy acts as 4 Attack with Combat + Brute Force followup'
AND universe = 'ERB';

-- 8 Intelligence cards
UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_intelligence_1c_2bf.webp'
WHERE name = '8 Intelligence' 
AND card_description = 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Combat followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_intelligence_1e_2bf.webp'
WHERE name = '8 Intelligence' 
AND card_description = 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Energy followup'
AND universe = 'ERB';

UPDATE teamwork_cards 
SET image_path = 'teamwork-universe/8_intelligence_1e_2c.webp'
WHERE name = '8 Intelligence' 
AND card_description = 'Teamwork card: 8 Intelligence acts as 4 Attack with Combat + Energy followup'
AND universe = 'ERB';

-- Log the changes
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % teamwork card image paths to match correct table', updated_count;
END $$;
