-- Populate set_number column for training cards
-- Format: 3-digit number only (e.g., 344, 345) - set identifier is ERB
-- Match by type_1, type_2 (checking both orders), value_to_use, and bonus columns

-- Training Cards - 5 Energy, 5 Combat +4
UPDATE training_cards SET set_number = '344' 
WHERE ((type_1 = 'Energy' AND type_2 = 'Combat') OR (type_1 = 'Combat' AND type_2 = 'Energy'))
  AND value_to_use = '5 or less' AND bonus = '+4';

-- Training Cards - 5 Energy, 5 Brute Force +4
UPDATE training_cards SET set_number = '345' 
WHERE ((type_1 = 'Energy' AND type_2 = 'Brute Force') OR (type_1 = 'Brute Force' AND type_2 = 'Energy'))
  AND value_to_use = '5 or less' AND bonus = '+4';

-- Training Cards - 5 Energy, 5 Intelligence +4
UPDATE training_cards SET set_number = '346' 
WHERE ((type_1 = 'Energy' AND type_2 = 'Intelligence') OR (type_1 = 'Intelligence' AND type_2 = 'Energy'))
  AND value_to_use = '5 or less' AND bonus = '+4';

-- Training Cards - 5 Combat, 5 Brute Force +4
UPDATE training_cards SET set_number = '347' 
WHERE ((type_1 = 'Combat' AND type_2 = 'Brute Force') OR (type_1 = 'Brute Force' AND type_2 = 'Combat'))
  AND value_to_use = '5 or less' AND bonus = '+4';

-- Training Cards - 5 Combat, 5 Intelligence +4
UPDATE training_cards SET set_number = '348' 
WHERE ((type_1 = 'Combat' AND type_2 = 'Intelligence') OR (type_1 = 'Intelligence' AND type_2 = 'Combat'))
  AND value_to_use = '5 or less' AND bonus = '+4';

-- Training Cards - 5 Brute Force, 5 Intelligence +4
UPDATE training_cards SET set_number = '349' 
WHERE ((type_1 = 'Brute Force' AND type_2 = 'Intelligence') OR (type_1 = 'Intelligence' AND type_2 = 'Brute Force'))
  AND value_to_use = '5 or less' AND bonus = '+4';

