-- Populate set_number column for Any-Power and MultiPower power cards
-- Format: 3-digit number only (e.g., 473, 474) - set identifier is ERB

-- Any-Power Power Cards
UPDATE power_cards SET set_number = '473' WHERE name = '5 - Any-Power' AND power_type = 'Any-Power' AND value = 5;
UPDATE power_cards SET set_number = '474' WHERE name = '6 - Any-Power' AND power_type = 'Any-Power' AND value = 6;
UPDATE power_cards SET set_number = '475' WHERE name = '7 - Any-Power' AND power_type = 'Any-Power' AND value = 7;
UPDATE power_cards SET set_number = '476' WHERE name = '8 - Any-Power' AND power_type = 'Any-Power' AND value = 8;

-- MultiPower Power Cards
UPDATE power_cards SET set_number = '477' WHERE name = '3 - Multi Power' AND power_type = 'Multi Power' AND value = 3;
UPDATE power_cards SET set_number = '478' WHERE name = '4 - Multi Power' AND power_type = 'Multi Power' AND value = 4;
UPDATE power_cards SET set_number = '479' WHERE name = '5 - Multi Power' AND power_type = 'Multi Power' AND value = 5;

