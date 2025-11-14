-- Populate set_number column for advanced universe cards
-- Format: 3-digit number only (e.g., 192, 193, 194) - set identifier is ERB
-- Match by name

UPDATE advanced_universe_cards SET set_number = '192' WHERE name = 'Shards of the Staff';
UPDATE advanced_universe_cards SET set_number = '193' WHERE name = 'Staff Fragments';
UPDATE advanced_universe_cards SET set_number = '194' WHERE name = 'Staff Head';

