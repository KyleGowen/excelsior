-- Populate set_number column for location cards
-- Format: 3-digit number only (e.g., 465, 466) - set identifier is ERB
-- Match by name

UPDATE locations SET set_number = '465' WHERE name = 'Dracula''s Armory';
UPDATE locations SET set_number = '466' WHERE name = 'Spartan Training Ground';
UPDATE locations SET set_number = '467' WHERE name = 'The Round Table';
UPDATE locations SET set_number = '468' WHERE name = 'Barsoom';
UPDATE locations SET set_number = '469' WHERE name = 'Asclepieion';
UPDATE locations SET set_number = '470' WHERE name = '221-B Baker St.';
UPDATE locations SET set_number = '471' WHERE name = 'Event Horizon: The Future';
UPDATE locations SET set_number = '472' WHERE name = 'The Land That Time Forgot';

