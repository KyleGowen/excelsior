-- Fix training card type assignments based on correct card data
UPDATE training_cards SET type_1 = 'Energy', type_2 = 'Brute Force' WHERE name = 'Training (Joan of Arc)';
UPDATE training_cards SET type_1 = 'Energy', type_2 = 'Combat' WHERE name = 'Training (Merlin)';
UPDATE training_cards SET type_1 = 'Combat', type_2 = 'Brute Force' WHERE name = 'Training (Robin Hood)';
