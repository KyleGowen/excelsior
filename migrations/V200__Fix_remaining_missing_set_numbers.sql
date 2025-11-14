-- Fix remaining missing set_numbers with correct exact names from database
-- Format: 3-digit number only - set identifier is ERB

-- Special Cards - using exact names as they appear in database
UPDATE special_cards SET set_number = '030' WHERE character_name = 'Captain Nemo' AND name = 'Never Set Foot on Dry Land' AND set_number IS NULL;
UPDATE special_cards SET set_number = '068' WHERE character_name = 'Dr. Watson' AND name = 'Always There for a Friend' AND set_number IS NULL;
UPDATE special_cards SET set_number = '091' WHERE character_name = 'Invisible Man' AND name = 'Didn''t See It Coming' AND set_number IS NULL;
UPDATE special_cards SET set_number = '102' WHERE character_name = 'Jane Porter' AND name = 'Not Without My Friends' AND set_number IS NULL;
UPDATE special_cards SET set_number = '124' WHERE character_name = 'King Arthur' AND name = 'Lead From the Front' AND set_number IS NULL;
UPDATE special_cards SET set_number = '131' WHERE character_name = 'Korak' AND name = 'To the Death' AND set_number IS NULL;
UPDATE special_cards SET set_number = '201' WHERE character_name = 'Robin Hood' AND name = 'Steal From the Rich' AND set_number IS NULL;
UPDATE special_cards SET set_number = '241' WHERE character_name = 'The Mummy' AND name = 'Reinvigorated by Fresh Organs' AND set_number IS NULL;
-- Wicked Witch cards - check both character name variations
UPDATE special_cards SET set_number = '272' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Aquaphobic' AND set_number IS NULL;
UPDATE special_cards SET set_number = '273' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Feared by All Witches' AND set_number IS NULL;
UPDATE special_cards SET set_number = '274' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'I Will Have Those Silver Shoes!' AND set_number IS NULL;
UPDATE special_cards SET set_number = '275' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'One Eye' AND set_number IS NULL;
UPDATE special_cards SET set_number = '276' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Harness the Wind' AND set_number IS NULL;
UPDATE special_cards SET set_number = '277' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Wolves, Crows, & Black Bees' AND set_number IS NULL;
-- Ancestral Rapier - check if it exists
UPDATE special_cards SET set_number = '439' WHERE character_name = 'Zorro' AND name = 'Ancestral Rapier' AND set_number IS NULL;

