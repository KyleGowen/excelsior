-- Populate teamwork cards data from markdown file
-- This migration inserts all teamwork cards from the overpower-erb-universe-teamwork.md file

INSERT INTO teamwork_cards (id, name, universe, card_description, to_use, acts_as, followup_attack_types, first_attack_bonus, second_attack_bonus, one_per_deck, image_path) VALUES
-- Energy 6 cards
('teamwork_6_energy_combat_intelligence', '6 Energy', 'ERB', 'Teamwork card: 6 Energy acts as 4 Attack with Combat + Intelligence followup', '6 Energy', '4 Attack', 'Combat + Intelligence', '0', '+1', false, 'teamwork-universe/398_6_energy_0c_1bf.webp'),
('teamwork_6_energy_brute_force_combat', '6 Energy', 'ERB', 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Combat followup', '6 Energy', '4 Attack', 'Brute Force + Combat', '0', '+1', false, 'teamwork-universe/399_6_energy_0c_1i.webp'),
('teamwork_6_energy_brute_force_intelligence', '6 Energy', 'ERB', 'Teamwork card: 6 Energy acts as 4 Attack with Brute Force + Intelligence followup', '6 Energy', '4 Attack', 'Brute Force + Intelligence', '0', '+1', false, 'teamwork-universe/400_6_energy_0b_1i.webp'),

-- Energy 7 cards
('teamwork_7_energy_combat_intelligence', '7 Energy', 'ERB', 'Teamwork card: 7 Energy acts as 4 Attack with Combat + Intelligence followup', '7 Energy', '4 Attack', 'Combat + Intelligence', '+1', '+1', false, 'teamwork-universe/401_7_energy_1c_1bf.webp'),
('teamwork_7_energy_brute_force_combat', '7 Energy', 'ERB', 'Teamwork card: 7 Energy acts as 4 Attack with Brute Force + Combat followup', '7 Energy', '4 Attack', 'Brute Force + Combat', '+1', '+1', false, 'teamwork-universe/402_7_energy_1c_1i.webp'),
('teamwork_7_energy_brute_force_intelligence', '7 Energy', 'ERB', 'Teamwork card: 7 Energy acts as 4 Attack with Brute Force + Intelligence followup', '7 Energy', '4 Attack', 'Brute Force + Intelligence', '+1', '+1', false, 'teamwork-universe/403_7_energy_1bf_1i.webp'),

-- Energy 8 cards
('teamwork_8_energy_intelligence_brute_force', '8 Energy', 'ERB', 'Teamwork card: 8 Energy acts as 4 Attack with Intelligence + Brute Force followup', '8 Energy', '4 Attack', 'Intelligence + Brute Force', '+1', '+2', false, 'teamwork-universe/404_8_energy_1c_2bf.webp'),
('teamwork_8_energy_brute_force_combat', '8 Energy', 'ERB', 'Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Combat followup', '8 Energy', '4 Attack', 'Brute Force + Combat', '+1', '+2', false, 'teamwork-universe/405_8_energy_1c_2i.webp'),
('teamwork_8_energy_brute_force_intelligence', '8 Energy', 'ERB', 'Teamwork card: 8 Energy acts as 4 Attack with Brute Force + Intelligence followup', '8 Energy', '4 Attack', 'Brute Force + Intelligence', '+1', '+2', false, 'teamwork-universe/406_8_energy_1bf_2i.webp'),

-- Combat 6 cards
('teamwork_6_combat_energy_intelligence', '6 Combat', 'ERB', 'Teamwork card: 6 Combat acts as 4 Attack with Energy + Intelligence followup', '6 Combat', '4 Attack', 'Energy + Intelligence', '0', '+1', false, 'teamwork-universe/407_6_combat_0e_1bf.webp'),
('teamwork_6_combat_brute_force_energy', '6 Combat', 'ERB', 'Teamwork card: 6 Combat acts as 4 Attack with Brute Force + Energy followup', '6 Combat', '4 Attack', 'Brute Force + Energy', '0', '+1', false, 'teamwork-universe/408_6_combat_0e_1i.webp'),
('teamwork_6_combat_brute_force_intelligence', '6 Combat', 'ERB', 'Teamwork card: 6 Combat acts as 4 Attack with Brute Force + Intelligence followup', '6 Combat', '4 Attack', 'Brute Force + Intelligence', '0', '+1', false, 'teamwork-universe/409_6_combat_0bf_1i.webp'),

-- Combat 7 cards
('teamwork_7_combat_energy_intelligence', '7 Combat', 'ERB', 'Teamwork card: 7 Combat acts as 4 Attack with Energy + Intelligence followup', '7 Combat', '4 Attack', 'Energy + Intelligence', '+1', '+1', false, 'teamwork-universe/410_7_combat_1e_1bf.webp'),
('teamwork_7_combat_brute_force_energy', '7 Combat', 'ERB', 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Energy followup', '7 Combat', '4 Attack', 'Brute Force + Energy', '+1', '+1', false, 'teamwork-universe/411_7_combat_1e_1i.webp'),
('teamwork_7_combat_brute_force_intelligence', '7 Combat', 'ERB', 'Teamwork card: 7 Combat acts as 4 Attack with Brute Force + Intelligence followup', '7 Combat', '4 Attack', 'Brute Force + Intelligence', '+1', '+1', false, 'teamwork-universe/412_7_combat_1bf_1i.webp'),

-- Combat 8 cards
('teamwork_8_combat_energy_intelligence', '8 Combat', 'ERB', 'Teamwork card: 8 Combat acts as 4 Attack with Energy + Intelligence followup', '8 Combat', '4 Attack', 'Energy + Intelligence', '+1', '+2', false, 'teamwork-universe/413_8_combat_1e_2bf.webp'),
('teamwork_8_combat_brute_force_energy', '8 Combat', 'ERB', 'Teamwork card: 8 Combat acts as 4 Attack with Brute Force + Energy followup', '8 Combat', '4 Attack', 'Brute Force + Energy', '+1', '+2', false, 'teamwork-universe/414_8_combat_1e_2i.webp'),
('teamwork_8_combat_brute_force_intelligence', '8 Combat', 'ERB', 'Teamwork card: 8 Combat acts as 4 Attack with Brute Force + Intelligence followup', '8 Combat', '4 Attack', 'Brute Force + Intelligence', '+1', '+2', false, 'teamwork-universe/415_8_combat_1bf_2i.webp'),

-- Brute Force 6 cards
('teamwork_6_brute_force_energy_combat', '6 Brute Force', 'ERB', 'Teamwork card: 6 Brute Force acts as 4 Attack with Energy + Combat followup', '6 Brute Force', '4 Attack', 'Energy + Combat', '0', '+1', false, 'teamwork-universe/416_6_brute_force_0e_1c.webp'),
('teamwork_6_brute_force_intelligence_energy', '6 Brute Force', 'ERB', 'Teamwork card: 6 Brute Force acts as 4 Attack with Intelligence + Energy followup', '6 Brute Force', '4 Attack', 'Intelligence + Energy', '0', '+1', false, 'teamwork-universe/417_6_brute_force_0e_1i.webp'),
('teamwork_6_brute_force_intelligence_combat', '6 Brute Force', 'ERB', 'Teamwork card: 6 Brute Force acts as 4 Attack with Intelligence + Combat followup', '6 Brute Force', '4 Attack', 'Intelligence + Combat', '0', '+1', false, 'teamwork-universe/418_6_brute_force_0c_1i.webp'),

-- Brute Force 7 cards
('teamwork_7_brute_force_energy_combat', '7 Brute Force', 'ERB', 'Teamwork card: 7 Brute Force acts as 4 Attack with Energy + Combat followup', '7 Brute Force', '4 Attack', 'Energy + Combat', '+1', '+1', false, 'teamwork-universe/419_7_brute_force_1e_1c.webp'),
('teamwork_7_brute_force_intelligence_energy', '7 Brute Force', 'ERB', 'Teamwork card: 7 Brute Force acts as 4 Attack with Intelligence + Energy followup', '7 Brute Force', '4 Attack', 'Intelligence + Energy', '+1', '+1', false, 'teamwork-universe/420_7_brute_force_1e_1i.webp'),
('teamwork_7_brute_force_intelligence_combat', '7 Brute Force', 'ERB', 'Teamwork card: 7 Brute Force acts as 4 Attack with Intelligence + Combat followup', '7 Brute Force', '4 Attack', 'Intelligence + Combat', '+1', '+1', false, 'teamwork-universe/421_7_brute_force_1c_1i.webp'),

-- Brute Force 8 cards
('teamwork_8_brute_force_energy_combat', '8 Brute Force', 'ERB', 'Teamwork card: 8 Brute Force acts as 4 Attack with Energy + Combat followup', '8 Brute Force', '4 Attack', 'Energy + Combat', '+1', '+2', false, 'teamwork-universe/422_8_brute_force_1e_2c.webp'),
('teamwork_8_brute_force_intelligence_energy', '8 Brute Force', 'ERB', 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Energy followup', '8 Brute Force', '4 Attack', 'Intelligence + Energy', '+1', '+2', false, 'teamwork-universe/423_8_brute_force_1e_2i.webp'),
('teamwork_8_brute_force_intelligence_combat', '8 Brute Force', 'ERB', 'Teamwork card: 8 Brute Force acts as 4 Attack with Intelligence + Combat followup', '8 Brute Force', '4 Attack', 'Intelligence + Combat', '+1', '+2', false, 'teamwork-universe/424_8_brute_force_1e_2c.webp'),

-- Intelligence 6 cards
('teamwork_6_intelligence_brute_force_combat', '6 Intelligence', 'ERB', 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Combat followup', '6 Intelligence', '4 Attack', 'Brute Force + Combat', '0', '+1', false, 'teamwork-universe/425_6_intelligence_0e_1c.webp'),
('teamwork_6_intelligence_brute_force_energy', '6 Intelligence', 'ERB', 'Teamwork card: 6 Intelligence acts as 4 Attack with Brute Force + Energy followup', '6 Intelligence', '4 Attack', 'Brute Force + Energy', '0', '+1', false, 'teamwork-universe/426_6_intelligence_0e_1bf.webp'),
('teamwork_6_intelligence_combat_energy', '6 Intelligence', 'ERB', 'Teamwork card: 6 Intelligence acts as 4 Attack with Combat + Energy followup', '6 Intelligence', '4 Attack', 'Combat + Energy', '0', '+1', false, 'teamwork-universe/427_6_intelligence_0c_1bf.webp'),

-- Intelligence 7 cards
('teamwork_7_intelligence_brute_force_combat', '7 Intelligence', 'ERB', 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Combat followup', '7 Intelligence', '4 Attack', 'Brute Force + Combat', '+1', '+1', false, 'teamwork-universe/428_7_intelligence_1e_1c.webp'),
('teamwork_7_intelligence_brute_force_energy', '7 Intelligence', 'ERB', 'Teamwork card: 7 Intelligence acts as 4 Attack with Brute Force + Energy followup', '7 Intelligence', '4 Attack', 'Brute Force + Energy', '+1', '+1', false, 'teamwork-universe/429_7_intelligence_1e_1bf.webp'),
('teamwork_7_intelligence_combat_energy', '7 Intelligence', 'ERB', 'Teamwork card: 7 Intelligence acts as 4 Attack with Combat + Energy followup', '7 Intelligence', '4 Attack', 'Combat + Energy', '+1', '+1', false, 'teamwork-universe/430_7_intelligence_1c_1bf.webp'),

-- Intelligence 8 cards
('teamwork_8_intelligence_brute_force_combat', '8 Intelligence', 'ERB', 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Combat followup', '8 Intelligence', '4 Attack', 'Brute Force + Combat', '+1', '+2', false, 'teamwork-universe/431_8_intelligence_1e_2c.webp'),
('teamwork_8_intelligence_brute_force_energy', '8 Intelligence', 'ERB', 'Teamwork card: 8 Intelligence acts as 4 Attack with Brute Force + Energy followup', '8 Intelligence', '4 Attack', 'Brute Force + Energy', '+1', '+2', false, 'teamwork-universe/432_8_intelligence_1e_2bf.webp'),
('teamwork_8_intelligence_combat_energy', '8 Intelligence', 'ERB', 'Teamwork card: 8 Intelligence acts as 4 Attack with Combat + Energy followup', '8 Intelligence', '4 Attack', 'Combat + Energy', '+1', '+2', false, 'teamwork-universe/433_8_intelligence_1c_2bf.webp'),

-- Any-Power cards
('teamwork_6_any_power', '6 Any-Power', 'ERB', 'Teamwork card: 6 Any-Power acts as 6 Attack with Any-Power / Any-Power followup', '6 Any-Power', '6 Attack', 'Any-Power / Any-Power', '0', '0', true, 'teamwork-universe/480_6_anypower.webp'),
('teamwork_7_any_power', '7 Any-Power', 'ERB', 'Teamwork card: 7 Any-Power acts as 6 Attack with Any-Power followup', '7 Any-Power', '6 Attack', 'Any-Power', '0', '+1', true, 'teamwork-universe/481_7_anypower.webp')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  card_description = EXCLUDED.card_description,
  to_use = EXCLUDED.to_use,
  acts_as = EXCLUDED.acts_as,
  followup_attack_types = EXCLUDED.followup_attack_types,
  first_attack_bonus = EXCLUDED.first_attack_bonus,
  second_attack_bonus = EXCLUDED.second_attack_bonus,
  one_per_deck = EXCLUDED.one_per_deck,
  image_path = EXCLUDED.image_path;
