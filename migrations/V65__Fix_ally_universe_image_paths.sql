-- Fix ally universe image paths to point to correct ally-universe directory
-- Map ally cards to their corresponding power card images

-- Allan Quatermain - 5 or less Energy → 3 Energy (uses 5_energy.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/5_energy.webp'
WHERE name = 'Allan Quatermain';

-- Guy of Gisborne - 7 or higher Combat → 2 Combat (uses 7_combat.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/7_combat.webp'
WHERE name = 'Guy of Gisborne';

-- Hera - 7 or higher Energy → 2 Energy (uses 7_energy.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/7_energy.webp'
WHERE name = 'Hera';

-- Huckleblock - 5 or less Brute Force → 3 Brute Force (uses 5_brute_force.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/5_brute_force.webp'
WHERE name = 'Huckleblock';

-- Little John - 5 or less Combat → 3 Combat (uses 5_combat.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/5_combat.webp'
WHERE name = 'Little John';

-- Professor Porter - 5 or less Intelligence → 3 Intelligence (uses 5_intelligence.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/5_intelligence.webp'
WHERE name = 'Professor Porter';

-- Queen Guinevere - 7 or higher Intelligence → 2 Intelligence (uses 7_intelligence.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/7_intelligence.webp'
WHERE name = 'Queen Guinevere';

-- Sir Galahad - 7 or higher Brute Force → 2 Brute Force (uses 7_brute_force.webp)
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/7_brute_force.webp'
WHERE name = 'Sir Galahad';
