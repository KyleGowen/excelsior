-- Populate set_number column for special cards that were missing set_numbers
-- Format: 3-digit number only - set identifier is ERB
-- Matching cards from the provided list to database entries

-- Special Cards
-- Note: Using exact names as they appear in the database
UPDATE special_cards SET set_number = '030' WHERE character_name = 'Captain Nemo' AND name = 'Never Set Foot on Dry Land';
UPDATE special_cards SET set_number = '068' WHERE character_name = 'Dr. Watson' AND name = 'Always There for a Friend';
UPDATE special_cards SET set_number = '091' WHERE character_name = 'Invisible Man' AND name = 'Didn''t See It Coming';
UPDATE special_cards SET set_number = '102' WHERE character_name = 'Jane Porter' AND name = 'Not Without My Friends';
UPDATE special_cards SET set_number = '124' WHERE character_name = 'King Arthur' AND name = 'Lead From the Front';
UPDATE special_cards SET set_number = '131' WHERE character_name = 'Korak' AND name = 'To the Death';
UPDATE special_cards SET set_number = '151' WHERE character_name = 'Merlin' AND name = 'Transmogrification';
UPDATE special_cards SET set_number = '175' WHERE character_name = 'Poseidon' AND name = 'Reclaim the Waters';
UPDATE special_cards SET set_number = '189' WHERE character_name = 'Ra' AND name = 'Cult of Menevis Bull';
UPDATE special_cards SET set_number = '201' WHERE character_name = 'Robin Hood' AND name = 'Steal From the Rich';
UPDATE special_cards SET set_number = '234' WHERE character_name = 'Tarzan' AND name = 'My Feet are Like Hands';
UPDATE special_cards SET set_number = '241' WHERE character_name = 'The Mummy' AND name = 'Reinvigorated by Fresh Organs';
UPDATE special_cards SET set_number = '264' WHERE character_name = 'Van Helsing' AND name = 'World-Renowned Doctor';
UPDATE special_cards SET set_number = '267' WHERE character_name = 'Victory Harben' AND name = 'Archery, Knives & Jiu-jitsu';
-- Wicked Witch cards - try both character name variations
UPDATE special_cards SET set_number = '272' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Aquaphobic';
UPDATE special_cards SET set_number = '273' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Feared by All Witches';
UPDATE special_cards SET set_number = '274' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'I Will Have Those Silver Shoes!';
UPDATE special_cards SET set_number = '275' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'One Eye';
UPDATE special_cards SET set_number = '276' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Harness the Wind';
UPDATE special_cards SET set_number = '277' WHERE (character_name = 'Wicked Witch of the West' OR character_name = 'Wicked Witch') AND name = 'Wolves, Crows, & Black Bees';
UPDATE special_cards SET set_number = '289' WHERE character_name = 'Zorro' AND name = 'Rapier';
UPDATE special_cards SET set_number = '439' WHERE character_name = 'Any Character' AND name = 'Heimdall';
UPDATE special_cards SET set_number = '439' WHERE character_name = 'Any Character' AND name = 'Ancestral Rapier';

