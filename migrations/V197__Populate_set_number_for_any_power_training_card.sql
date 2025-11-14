-- Populate set_number column for 5 Any-Power training card
-- Format: 3-digit number only (545) - set identifier is ERB
-- Match by type_1, type_2 (both Any-Power), and value_to_use

UPDATE training_cards SET set_number = '545' 
WHERE type_1 = 'Any-Power' 
  AND type_2 = 'Any-Power'
  AND value_to_use = '5 or less';

