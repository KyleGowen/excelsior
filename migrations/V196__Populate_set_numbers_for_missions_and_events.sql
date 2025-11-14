-- Populate set_number column for mission cards and event cards
-- Format: 3-digit number only (e.g., 350, 351) - set identifier is ERB
-- Match missions by name and mission_set
-- Match events by name and mission_set

-- Call of Cthulhu Missions (350-356)
UPDATE missions SET set_number = '350' WHERE name = 'The Dreams of Men' AND mission_set = 'The Call of Cthulhu';
UPDATE missions SET set_number = '351' WHERE name = 'Professor Angell''s Investigation' AND mission_set = 'The Call of Cthulhu';
UPDATE missions SET set_number = '352' WHERE name = 'New Orleans, 1908' AND mission_set = 'The Call of Cthulhu';
UPDATE missions SET set_number = '353' WHERE name = 'Worshipping the Great Old One' AND mission_set = 'The Call of Cthulhu';
UPDATE missions SET set_number = '354' WHERE name = 'The Alert' AND mission_set = 'The Call of Cthulhu';
UPDATE missions SET set_number = '355' WHERE name = 'Johansen''s Widow' AND mission_set = 'The Call of Cthulhu';
UPDATE missions SET set_number = '356' WHERE name = 'Gone Too Far' AND mission_set = 'The Call of Cthulhu';

-- Call of Cthulhu Events (357-361)
UPDATE events SET set_number = '357' WHERE name = 'Desperate Gamble' AND mission_set = 'The Call of Cthulhu';
UPDATE events SET set_number = '358' WHERE name = 'The Cost of Knowledge is Sanity' AND mission_set = 'The Call of Cthulhu';
UPDATE events SET set_number = '359' WHERE name = 'Stars Align' AND mission_set = 'The Call of Cthulhu';
UPDATE events SET set_number = '360' WHERE name = 'Who Can You Trust' AND mission_set = 'The Call of Cthulhu';
UPDATE events SET set_number = '361' WHERE name = 'Healed by a Dark Power' AND mission_set = 'The Call of Cthulhu';

-- King of the Jungle Missions (362-368)
UPDATE missions SET set_number = '362' WHERE name = 'Tarzan of the Apes' AND mission_set = 'King of the Jungle';
UPDATE missions SET set_number = '363' WHERE name = 'Beasts of Tarzan' AND mission_set = 'King of the Jungle';
UPDATE missions SET set_number = '364' WHERE name = 'Tarzan and the Golden Lion' AND mission_set = 'King of the Jungle';
UPDATE missions SET set_number = '365' WHERE name = 'Tarzan at the Earth''s Core' AND mission_set = 'King of the Jungle';
UPDATE missions SET set_number = '366' WHERE name = 'Tarzan and the City of Gold' AND mission_set = 'King of the Jungle';
UPDATE missions SET set_number = '367' WHERE name = 'Tarzan''s Quest' AND mission_set = 'King of the Jungle';
UPDATE missions SET set_number = '368' WHERE name = 'Tarzan and the Castaways' AND mission_set = 'King of the Jungle';

-- King of the Jungle Events (369-373)
UPDATE events SET set_number = '369' WHERE name = 'The Lost City of Opar' AND mission_set = 'King of the Jungle';
UPDATE events SET set_number = '370' WHERE name = 'Tarzan the Terrible' AND mission_set = 'King of the Jungle';
UPDATE events SET set_number = '371' WHERE name = 'The Power of Gonfal' AND mission_set = 'King of the Jungle';
UPDATE events SET set_number = '372' WHERE name = 'Jane' AND mission_set = 'King of the Jungle';
UPDATE events SET set_number = '373' WHERE name = 'A Captive no More' AND mission_set = 'King of the Jungle';

-- Warlord of Mars Missions (374-380)
-- Order based on screenshot: The Face of Death (1), The Battle of Kings (2), A Fighting Man of Mars (3), Swords of Mars (4), The Invisible Men (5), The Loyalty of Woola (6), Under the Moons of Mars (7)
UPDATE missions SET set_number = '374' WHERE name = 'The Face of Death' AND mission_set = 'The Warlord of Mars';
UPDATE missions SET set_number = '375' WHERE name = 'The Battle of Kings' AND mission_set = 'The Warlord of Mars';
UPDATE missions SET set_number = '376' WHERE name = 'A Fighting Man of Mars' AND mission_set = 'The Warlord of Mars';
UPDATE missions SET set_number = '377' WHERE name = 'Swords of Mars' AND mission_set = 'The Warlord of Mars';
UPDATE missions SET set_number = '378' WHERE name = 'The Invisible Men' AND mission_set = 'The Warlord of Mars';
UPDATE missions SET set_number = '379' WHERE name = 'The Loyalty of Woola' AND mission_set = 'The Warlord of Mars';
UPDATE missions SET set_number = '380' WHERE name = 'Under the Moons of Mars' AND mission_set = 'The Warlord of Mars';

-- Chronicles of Mars Events (381-385)
-- Note: Events use "The Warlord of Mars" mission_set after migration V124, but matching by name
UPDATE events SET set_number = '381' WHERE name = 'The Giant Man of Mars' AND mission_set = 'The Warlord of Mars';
UPDATE events SET set_number = '382' WHERE name = 'The Battle with Zad' AND mission_set = 'The Warlord of Mars';
UPDATE events SET set_number = '383' WHERE name = 'Eyes in the Dark' AND mission_set = 'The Warlord of Mars';
UPDATE events SET set_number = '384' WHERE name = 'A Venomous Threat' AND mission_set = 'The Warlord of Mars';
UPDATE events SET set_number = '385' WHERE name = 'The Chamber of Reptiles' AND mission_set = 'The Warlord of Mars';

-- Time Wars: Rise of the Gods Missions (386-392)
-- Assigning in order as requested (user will fix later)
UPDATE missions SET set_number = '386' WHERE name = 'The Gods Return' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE missions SET set_number = '387' WHERE name = 'Divine Retribution' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE missions SET set_number = '388' WHERE name = 'Traveler''s Warning' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE missions SET set_number = '389' WHERE name = 'Warriors from Across Time' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE missions SET set_number = '390' WHERE name = 'Tide Begins to Turn' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE missions SET set_number = '391' WHERE name = 'Supernatural Allies' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE missions SET set_number = '392' WHERE name = 'Battle at Olympus' AND mission_set = 'Time Wars: Rise of the Gods';

-- Time Wars: Rise of the Gods Events (393-397)
UPDATE events SET set_number = '393' WHERE name = 'Rally Our Allies' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE events SET set_number = '394' WHERE name = 'Second Chances' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE events SET set_number = '395' WHERE name = 'Heroes We Need' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE events SET set_number = '396' WHERE name = 'Ready for War' AND mission_set = 'Time Wars: Rise of the Gods';
UPDATE events SET set_number = '397' WHERE name = 'Getting Our Hands Dirty' AND mission_set = 'Time Wars: Rise of the Gods';

