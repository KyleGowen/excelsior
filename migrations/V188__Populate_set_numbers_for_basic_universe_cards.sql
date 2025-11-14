-- Populate set_number column for basic universe cards
-- Format: 3-digit number only (e.g., 332, 333) - set identifier is ERB
-- Match by type, value_to_use, and bonus columns

-- Energy Basic Universe Cards
UPDATE basic_universe_cards SET set_number = '332' 
WHERE type = 'Energy' AND value_to_use = '6 or greater' AND bonus = '+2';

UPDATE basic_universe_cards SET set_number = '333' 
WHERE type = 'Energy' AND value_to_use = '6 or greater' AND bonus = '+3';

UPDATE basic_universe_cards SET set_number = '334' 
WHERE type = 'Energy' AND value_to_use = '7 or greater' AND bonus = '+3';

-- Combat Basic Universe Cards
UPDATE basic_universe_cards SET set_number = '335' 
WHERE type = 'Combat' AND value_to_use = '6 or greater' AND bonus = '+2';

UPDATE basic_universe_cards SET set_number = '336' 
WHERE type = 'Combat' AND value_to_use = '6 or greater' AND bonus = '+3';

UPDATE basic_universe_cards SET set_number = '337' 
WHERE type = 'Combat' AND value_to_use = '7 or greater' AND bonus = '+3';

-- Brute Force Basic Universe Cards
UPDATE basic_universe_cards SET set_number = '338' 
WHERE type = 'Brute Force' AND value_to_use = '6 or greater' AND bonus = '+2';

UPDATE basic_universe_cards SET set_number = '339' 
WHERE type = 'Brute Force' AND value_to_use = '6 or greater' AND bonus = '+3';

UPDATE basic_universe_cards SET set_number = '340' 
WHERE type = 'Brute Force' AND value_to_use = '7 or greater' AND bonus = '+3';

-- Intelligence Basic Universe Cards
UPDATE basic_universe_cards SET set_number = '341' 
WHERE type = 'Intelligence' AND value_to_use = '6 or greater' AND bonus = '+2';

UPDATE basic_universe_cards SET set_number = '342' 
WHERE type = 'Intelligence' AND value_to_use = '6 or greater' AND bonus = '+3';

UPDATE basic_universe_cards SET set_number = '343' 
WHERE type = 'Intelligence' AND value_to_use = '7 or greater' AND bonus = '+3';

