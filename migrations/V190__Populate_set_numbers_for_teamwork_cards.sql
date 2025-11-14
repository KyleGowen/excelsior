-- Populate set_number column for teamwork cards
-- Format: 3-digit number only (e.g., 398, 399) - set identifier is ERB
-- Match by to_use, first_attack_bonus, second_attack_bonus, and followup_attack_types
-- Note: followup_attack_types uses " + " separator, checking both orders

-- Energy Teamwork Cards - 6 Energy +0/+1
UPDATE teamwork_cards SET set_number = '398' 
WHERE to_use = '6 Energy' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Brute Force + Intelligence' OR followup_attack_types = 'Intelligence + Brute Force');

UPDATE teamwork_cards SET set_number = '399' 
WHERE to_use = '6 Energy' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Brute Force' OR followup_attack_types = 'Brute Force + Combat');

UPDATE teamwork_cards SET set_number = '400' 
WHERE to_use = '6 Energy' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Intelligence' OR followup_attack_types = 'Intelligence + Combat');

-- Energy Teamwork Cards - 7 Energy +1/+1
UPDATE teamwork_cards SET set_number = '401' 
WHERE to_use = '7 Energy' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Intelligence' OR followup_attack_types = 'Intelligence + Combat');

UPDATE teamwork_cards SET set_number = '402' 
WHERE to_use = '7 Energy' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Brute Force' OR followup_attack_types = 'Brute Force + Combat');

UPDATE teamwork_cards SET set_number = '403' 
WHERE to_use = '7 Energy' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Brute Force + Intelligence' OR followup_attack_types = 'Intelligence + Brute Force');

-- Energy Teamwork Cards - 8 Energy +1/+2
UPDATE teamwork_cards SET set_number = '404' 
WHERE to_use = '8 Energy' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Combat + Brute Force' OR followup_attack_types = 'Brute Force + Combat');

UPDATE teamwork_cards SET set_number = '405' 
WHERE to_use = '8 Energy' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Brute Force + Intelligence' OR followup_attack_types = 'Intelligence + Brute Force');

UPDATE teamwork_cards SET set_number = '406' 
WHERE to_use = '8 Energy' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Combat + Intelligence' OR followup_attack_types = 'Intelligence + Combat');

-- Combat Teamwork Cards - 6 Combat +0/+1
UPDATE teamwork_cards SET set_number = '407' 
WHERE to_use = '6 Combat' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Brute Force' OR followup_attack_types = 'Brute Force + Energy');

UPDATE teamwork_cards SET set_number = '408' 
WHERE to_use = '6 Combat' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Brute Force + Intelligence' OR followup_attack_types = 'Intelligence + Brute Force');

UPDATE teamwork_cards SET set_number = '409' 
WHERE to_use = '6 Combat' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Intelligence' OR followup_attack_types = 'Intelligence + Energy');

-- Combat Teamwork Cards - 7 Combat +1/+1
UPDATE teamwork_cards SET set_number = '410' 
WHERE to_use = '7 Combat' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Brute Force + Intelligence' OR followup_attack_types = 'Intelligence + Brute Force');

UPDATE teamwork_cards SET set_number = '411' 
WHERE to_use = '7 Combat' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Intelligence' OR followup_attack_types = 'Intelligence + Energy');

UPDATE teamwork_cards SET set_number = '412' 
WHERE to_use = '7 Combat' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Brute Force' OR followup_attack_types = 'Brute Force + Energy');

-- Combat Teamwork Cards - 8 Combat +1/+2
UPDATE teamwork_cards SET set_number = '413' 
WHERE to_use = '8 Combat' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Energy + Intelligence' OR followup_attack_types = 'Intelligence + Energy');

UPDATE teamwork_cards SET set_number = '414' 
WHERE to_use = '8 Combat' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Brute Force + Intelligence' OR followup_attack_types = 'Intelligence + Brute Force');

UPDATE teamwork_cards SET set_number = '415' 
WHERE to_use = '8 Combat' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Energy + Brute Force' OR followup_attack_types = 'Brute Force + Energy');

-- Brute Force Teamwork Cards - 6 Brute Force +0/+1
UPDATE teamwork_cards SET set_number = '416' 
WHERE to_use = '6 Brute Force' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Combat' OR followup_attack_types = 'Combat + Energy');

UPDATE teamwork_cards SET set_number = '417' 
WHERE to_use = '6 Brute Force' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Intelligence' OR followup_attack_types = 'Intelligence + Energy');

UPDATE teamwork_cards SET set_number = '418' 
WHERE to_use = '6 Brute Force' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Intelligence' OR followup_attack_types = 'Intelligence + Combat');

-- Brute Force Teamwork Cards - 7 Brute Force +1/+1
UPDATE teamwork_cards SET set_number = '419' 
WHERE to_use = '7 Brute Force' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Intelligence' OR followup_attack_types = 'Intelligence + Energy');

UPDATE teamwork_cards SET set_number = '420' 
WHERE to_use = '7 Brute Force' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Combat' OR followup_attack_types = 'Combat + Energy');

UPDATE teamwork_cards SET set_number = '421' 
WHERE to_use = '7 Brute Force' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Intelligence' OR followup_attack_types = 'Intelligence + Combat');

-- Brute Force Teamwork Cards - 8 Brute Force +1/+2
UPDATE teamwork_cards SET set_number = '422' 
WHERE to_use = '8 Brute Force' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Combat + Intelligence' OR followup_attack_types = 'Intelligence + Combat');

UPDATE teamwork_cards SET set_number = '423' 
WHERE to_use = '8 Brute Force' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Energy + Intelligence' OR followup_attack_types = 'Intelligence + Energy');

UPDATE teamwork_cards SET set_number = '424' 
WHERE to_use = '8 Brute Force' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Energy + Combat' OR followup_attack_types = 'Combat + Energy');

-- Intelligence Teamwork Cards - 6 Intelligence +0/+1
UPDATE teamwork_cards SET set_number = '425' 
WHERE to_use = '6 Intelligence' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Brute Force' OR followup_attack_types = 'Brute Force + Combat');

UPDATE teamwork_cards SET set_number = '426' 
WHERE to_use = '6 Intelligence' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Brute Force' OR followup_attack_types = 'Brute Force + Energy');

UPDATE teamwork_cards SET set_number = '427' 
WHERE to_use = '6 Intelligence' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Combat' OR followup_attack_types = 'Combat + Energy');

-- Intelligence Teamwork Cards - 7 Intelligence +1/+1
UPDATE teamwork_cards SET set_number = '428' 
WHERE to_use = '7 Intelligence' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Combat + Brute Force' OR followup_attack_types = 'Brute Force + Combat');

UPDATE teamwork_cards SET set_number = '429' 
WHERE to_use = '7 Intelligence' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Brute Force' OR followup_attack_types = 'Brute Force + Energy');

UPDATE teamwork_cards SET set_number = '430' 
WHERE to_use = '7 Intelligence' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '1'
  AND (followup_attack_types = 'Energy + Combat' OR followup_attack_types = 'Combat + Energy');

-- Intelligence Teamwork Cards - 8 Intelligence +1/+2
UPDATE teamwork_cards SET set_number = '431' 
WHERE to_use = '8 Intelligence' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Combat + Brute Force' OR followup_attack_types = 'Brute Force + Combat');

UPDATE teamwork_cards SET set_number = '432' 
WHERE to_use = '8 Intelligence' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Energy + Combat' OR followup_attack_types = 'Combat + Energy');

UPDATE teamwork_cards SET set_number = '433' 
WHERE to_use = '8 Intelligence' 
  AND first_attack_bonus = '1' 
  AND second_attack_bonus = '2'
  AND (followup_attack_types = 'Energy + Brute Force' OR followup_attack_types = 'Brute Force + Energy');

