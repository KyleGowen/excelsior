-- Populate training cards data from markdown file
-- This migration inserts all training cards from the overpower-erb-training.md file

INSERT INTO training_cards (id, name, universe, card_description, type_1, type_2, value_to_use, bonus, one_per_deck, image_path) VALUES
('training_merlin', 'Training (Merlin)', 'ERB', 'Training card: Brute Force + Combat, 5 or less, +4 bonus', 'Brute Force', 'Combat', '5 or less', '+4', false, 'training/merlin.webp'),
('training_joan_of_arc', 'Training (Joan of Arc)', 'ERB', 'Training card: Energy + Intelligence, 5 or less, +4 bonus', 'Energy', 'Intelligence', '5 or less', '+4', false, 'training/joan_of_arc.webp'),
('training_cultists', 'Training (Cultists)', 'ERB', 'Training card: Energy + Intelligence, 5 or less, +4 bonus', 'Energy', 'Intelligence', '5 or less', '+4', false, 'training/cultists.webp'),
('training_robin_hood', 'Training (Robin Hood)', 'ERB', 'Training card: Brute Force + Intelligence, 5 or less, +4 bonus', 'Brute Force', 'Intelligence', '5 or less', '+4', false, 'training/robin_hood.webp'),
('training_leonidas', 'Training (Leonidas)', 'ERB', 'Training card: Combat + Intelligence, 5 or less, +4 bonus', 'Combat', 'Intelligence', '5 or less', '+4', false, 'training/leonidas.webp'),
('training_lancelot', 'Training (Lancelot)', 'ERB', 'Training card: Brute Force + Intelligence, 5 or less, +4 bonus', 'Brute Force', 'Intelligence', '5 or less', '+4', false, 'training/lancelot.webp'),
('training_sekhmet', 'Training (Sekhmet)', 'ERB', 'Training card: Any-Power + Any-Power, 5 or less, +5 bonus', 'Any-Power', 'Any-Power', '5 or less', '+5', true, 'training/sekhmet.webp')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  card_description = EXCLUDED.card_description,
  type_1 = EXCLUDED.type_1,
  type_2 = EXCLUDED.type_2,
  value_to_use = EXCLUDED.value_to_use,
  bonus = EXCLUDED.bonus,
  one_per_deck = EXCLUDED.one_per_deck,
  image_path = EXCLUDED.image_path;
