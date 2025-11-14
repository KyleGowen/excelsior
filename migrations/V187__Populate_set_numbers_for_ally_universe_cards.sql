-- Populate set_number column for ally universe cards
-- Format: 3-digit number only (e.g., 324, 325) - set identifier is ERB
-- Match by stat_to_use and stat_type_to_use columns

-- Energy Ally Cards
UPDATE ally_universe_cards SET set_number = '324' 
WHERE stat_to_use = '5 or less' AND stat_type_to_use = 'Energy';

UPDATE ally_universe_cards SET set_number = '325' 
WHERE stat_to_use = '7 or higher' AND stat_type_to_use = 'Energy';

-- Combat Ally Cards
UPDATE ally_universe_cards SET set_number = '326' 
WHERE stat_to_use = '5 or less' AND stat_type_to_use = 'Combat';

UPDATE ally_universe_cards SET set_number = '327' 
WHERE stat_to_use = '7 or higher' AND stat_type_to_use = 'Combat';

-- Brute Force Ally Cards
UPDATE ally_universe_cards SET set_number = '328' 
WHERE stat_to_use = '5 or less' AND stat_type_to_use = 'Brute Force';

UPDATE ally_universe_cards SET set_number = '329' 
WHERE stat_to_use = '7 or higher' AND stat_type_to_use = 'Brute Force';

-- Intelligence Ally Cards
UPDATE ally_universe_cards SET set_number = '330' 
WHERE stat_to_use = '5 or less' AND stat_type_to_use = 'Intelligence';

UPDATE ally_universe_cards SET set_number = '331' 
WHERE stat_to_use = '7 or higher' AND stat_type_to_use = 'Intelligence';

