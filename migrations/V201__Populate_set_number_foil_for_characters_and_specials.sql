-- Populate set_number_foil column for character cards and special cards
-- Format: 3-digit number with F suffix (e.g., 035F, 036F) - set identifier is ERB
--
-- Characters (excluding alternate art cards)
UPDATE characters SET set_number_foil = '035F' WHERE name = 'Carson of Venus' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '042F' WHERE name = 'Count of Monte Cristo' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '048F' WHERE name = 'Cthulhu' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '055F' WHERE name = 'Dejah Thoris' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '097F' WHERE name = 'Jane Porter' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '111F' WHERE name = 'John Carter of Mars' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '118F' WHERE name = 'King Arthur' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '125F' WHERE name = 'Korak' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '146F' WHERE name = 'Merlin' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '153F' WHERE name = 'Mina Harker' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '181F' WHERE name = 'Professor Moriarty' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '216F' WHERE name = 'Sun Wukong' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '223F' WHERE name = 'Tars Tarkas' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '230F' WHERE name = 'Tarzan' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '237F' WHERE name = 'The Mummy' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '244F' WHERE name = 'The Three Musketeers' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '251F' WHERE name = 'Time Traveler' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '265F' WHERE name = 'Victory Harben' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '279F' WHERE name = 'Zeus' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number_foil = '285F' WHERE name = 'Zorro' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);

-- Special Cards - Carson of Venus
UPDATE special_cards SET set_number_foil = '036F' WHERE character_name = 'Carson of Venus' AND name = 'Janjong Duare Mintep';
UPDATE special_cards SET set_number_foil = '037F' WHERE character_name = 'Carson of Venus' AND name = 'On the Razor''s Edge';
UPDATE special_cards SET set_number_foil = '038F' WHERE character_name = 'Carson of Venus' AND name = 'Telepathic Resistance';
UPDATE special_cards SET set_number_foil = '039F' WHERE character_name = 'Carson of Venus' AND name = 'Sometimes Piracy is the Best Option';
UPDATE special_cards SET set_number_foil = '040F' WHERE character_name = 'Carson of Venus' AND name = 'T-Ray Gun';

-- Special Cards - Count of Monte Cristo
UPDATE special_cards SET set_number_foil = '043F' WHERE character_name = 'Count of Monte Cristo' AND name = 'Friend to Foe';
UPDATE special_cards SET set_number_foil = '044F' WHERE character_name = 'Count of Monte Cristo' AND name = 'Jacopo';
UPDATE special_cards SET set_number_foil = '045F' WHERE character_name = 'Count of Monte Cristo' AND name = 'Network of Thieves';
UPDATE special_cards SET set_number_foil = '046F' WHERE character_name = 'Count of Monte Cristo' AND name = 'Surprise Swordsman';
UPDATE special_cards SET set_number_foil = '047F' WHERE character_name = 'Count of Monte Cristo' AND name = 'Unlimited Resources';

-- Special Cards - Cthulhu
UPDATE special_cards SET set_number_foil = '049F' WHERE character_name = 'Cthulhu' AND name = 'Ancient One';
UPDATE special_cards SET set_number_foil = '050F' WHERE character_name = 'Cthulhu' AND name = 'Devoted Follower';
UPDATE special_cards SET set_number_foil = '051F' WHERE character_name = 'Cthulhu' AND name = 'Distracting Intervention';
UPDATE special_cards SET set_number_foil = '052F' WHERE character_name = 'Cthulhu' AND name = 'Network of Fanatics';
UPDATE special_cards SET set_number_foil = '053F' WHERE character_name = 'Cthulhu' AND name = 'The Call of Cthulhu';
UPDATE special_cards SET set_number_foil = '054F' WHERE character_name = 'Cthulhu' AND name = 'The Sleeper Awakens';

-- Special Cards - Dejah Thoris
UPDATE special_cards SET set_number_foil = '056F' WHERE character_name = 'Dejah Thoris' AND name = 'Warrior of Helium';
UPDATE special_cards SET set_number_foil = '057F' WHERE character_name = 'Dejah Thoris' AND name = 'Diplomat to All Martians';
UPDATE special_cards SET set_number_foil = '059F' WHERE character_name = 'Dejah Thoris' AND name = 'Head of Martian Science';
UPDATE special_cards SET set_number_foil = '060F' WHERE character_name = 'Dejah Thoris' AND name = 'Protector of Barsoom';
UPDATE special_cards SET set_number_foil = '061F' WHERE character_name = 'Dejah Thoris' AND name = 'Champions of Barsoom';

-- Special Cards - Jane Porter
UPDATE special_cards SET set_number_foil = '098F' WHERE character_name = 'Jane Porter' AND name = 'Archimedes Q. Porter';
UPDATE special_cards SET set_number_foil = '100F' WHERE character_name = 'Jane Porter' AND name = 'Tenacious Pursuit';
UPDATE special_cards SET set_number_foil = '101F' WHERE character_name = 'Jane Porter' AND name = 'Lady of the Jungle';
UPDATE special_cards SET set_number_foil = '102F' WHERE character_name = 'Jane Porter' AND name = 'Not without my Friends';
UPDATE special_cards SET set_number_foil = '103F' WHERE character_name = 'Jane Porter' AND name = 'Not a Damsel in Distress';

-- Special Cards - John Carter of Mars
UPDATE special_cards SET set_number_foil = '112F' WHERE character_name = 'John Carter of Mars' AND name = 'Dotar Sojat';
UPDATE special_cards SET set_number_foil = '114F' WHERE character_name = 'John Carter of Mars' AND name = 'Leap into the Fray';
UPDATE special_cards SET set_number_foil = '115F' WHERE character_name = 'John Carter of Mars' AND name = 'Lower Gravity';
UPDATE special_cards SET set_number_foil = '116F' WHERE character_name = 'John Carter of Mars' AND name = 'Superhuman Endurance';
UPDATE special_cards SET set_number_foil = '117F' WHERE character_name = 'John Carter of Mars' AND name = 'Virginia Fighting Man';

-- Special Cards - King Arthur
UPDATE special_cards SET set_number_foil = '119F' WHERE character_name = 'King Arthur' AND name = 'Excalibur';
UPDATE special_cards SET set_number_foil = '120F' WHERE character_name = 'King Arthur' AND name = 'King of Camelot';
UPDATE special_cards SET set_number_foil = '121F' WHERE character_name = 'King Arthur' AND name = 'Knights of the Round Table';
UPDATE special_cards SET set_number_foil = '123F' WHERE character_name = 'King Arthur' AND name = 'Heavy is the Head';
UPDATE special_cards SET set_number_foil = '124F' WHERE character_name = 'King Arthur' AND name = 'Lead from the Front';

-- Special Cards - Korak
UPDATE special_cards SET set_number_foil = '126F' WHERE character_name = 'Korak' AND name = 'John Clayton III';
UPDATE special_cards SET set_number_foil = '127F' WHERE character_name = 'Korak' AND name = 'Jungle Survival';
UPDATE special_cards SET set_number_foil = '129F' WHERE character_name = 'Korak' AND name = 'Meriem and Jackie Clayton';
UPDATE special_cards SET set_number_foil = '130F' WHERE character_name = 'Korak' AND name = 'Son of the Jungle';
UPDATE special_cards SET set_number_foil = '131F' WHERE character_name = 'Korak' AND name = 'To The Death';

-- Special Cards - Merlin
UPDATE special_cards SET set_number_foil = '147F' WHERE character_name = 'Merlin' AND name = 'Archimedes';
UPDATE special_cards SET set_number_foil = '148F' WHERE character_name = 'Merlin' AND name = 'Ascendant Mage';
UPDATE special_cards SET set_number_foil = '149F' WHERE character_name = 'Merlin' AND name = 'For Camelot!';
UPDATE special_cards SET set_number_foil = '150F' WHERE character_name = 'Merlin' AND name = 'Foretell the Future';
UPDATE special_cards SET set_number_foil = '152F' WHERE character_name = 'Merlin' AND name = 'Summon the Elements';

-- Special Cards - Mina Harker
UPDATE special_cards SET set_number_foil = '154F' WHERE character_name = 'Mina Harker' AND name = 'Dracula''s Telepathic Connection';
UPDATE special_cards SET set_number_foil = '155F' WHERE character_name = 'Mina Harker' AND name = 'Jonathan Harker, Solicitor';
UPDATE special_cards SET set_number_foil = '156F' WHERE character_name = 'Mina Harker' AND name = 'Nocturnal Hunter';
UPDATE special_cards SET set_number_foil = '158F' WHERE character_name = 'Mina Harker' AND name = 'Tracking Movements';
UPDATE special_cards SET set_number_foil = '159F' WHERE character_name = 'Mina Harker' AND name = 'Vampiric Celerity';

-- Special Cards - Professor Moriarty
UPDATE special_cards SET set_number_foil = '182F' WHERE character_name = 'Professor Moriarty' AND name = 'Complex Criminal Scheme';
UPDATE special_cards SET set_number_foil = '184F' WHERE character_name = 'Professor Moriarty' AND name = 'Future Plans';
UPDATE special_cards SET set_number_foil = '185F' WHERE character_name = 'Professor Moriarty' AND name = 'Mathematical Genius';
UPDATE special_cards SET set_number_foil = '186F' WHERE character_name = 'Professor Moriarty' AND name = 'Napoleon of Crime';
UPDATE special_cards SET set_number_foil = '187F' WHERE character_name = 'Professor Moriarty' AND name = 'Tactical Fighter';

-- Special Cards - Sun Wukong
UPDATE special_cards SET set_number_foil = '217F' WHERE character_name = 'Sun Wukong' AND name = 'Cloud Surfing';
UPDATE special_cards SET set_number_foil = '218F' WHERE character_name = 'Sun Wukong' AND name = 'Godly Strength';
UPDATE special_cards SET set_number_foil = '220F' WHERE character_name = 'Sun Wukong' AND name = 'Staff of the Monkey King';
UPDATE special_cards SET set_number_foil = '221F' WHERE character_name = 'Sun Wukong' AND name = 'Stone Skin';
UPDATE special_cards SET set_number_foil = '222F' WHERE character_name = 'Sun Wukong' AND name = 'Transformation Trickery';

-- Special Cards - Tars Tarkas
UPDATE special_cards SET set_number_foil = '225F' WHERE character_name = 'Tars Tarkas' AND name = 'Barsoomian Warrior & Statesman';
UPDATE special_cards SET set_number_foil = '226F' WHERE character_name = 'Tars Tarkas' AND name = 'Four-Armed Warrior';
UPDATE special_cards SET set_number_foil = '227F' WHERE character_name = 'Tars Tarkas' AND name = 'Jeddak of Thark';
UPDATE special_cards SET set_number_foil = '228F' WHERE character_name = 'Tars Tarkas' AND name = 'Protector of the Incubator';
UPDATE special_cards SET set_number_foil = '229F' WHERE character_name = 'Tars Tarkas' AND name = 'Sola';

-- Special Cards - Tarzan
UPDATE special_cards SET set_number_foil = '231F' WHERE character_name = 'Tarzan' AND name = 'Emotional Senses';
UPDATE special_cards SET set_number_foil = '232F' WHERE character_name = 'Tarzan' AND name = 'Jungle Tactics';
UPDATE special_cards SET set_number_foil = '234F' WHERE character_name = 'Tarzan' AND name = 'My Feet Feel Like Hands';
UPDATE special_cards SET set_number_foil = '235F' WHERE character_name = 'Tarzan' AND name = 'Raised by Mangani Apes';
UPDATE special_cards SET set_number_foil = '236F' WHERE character_name = 'Tarzan' AND name = 'Deceptive Maneuver';

-- Special Cards - The Mummy
UPDATE special_cards SET set_number_foil = '238F' WHERE character_name = 'The Mummy' AND name = 'Ancient Wisdom';
UPDATE special_cards SET set_number_foil = '239F' WHERE character_name = 'The Mummy' AND name = 'Fury of the Desert';
UPDATE special_cards SET set_number_foil = '241F' WHERE character_name = 'The Mummy' AND name = 'Reinvigorated By Fresh Organs';
UPDATE special_cards SET set_number_foil = '242F' WHERE character_name = 'The Mummy' AND name = 'Relentless Pursuit';
UPDATE special_cards SET set_number_foil = '243F' WHERE character_name = 'The Mummy' AND name = 'The Eternal Journey';

-- Special Cards - The Three Musketeers
UPDATE special_cards SET set_number_foil = '246F' WHERE character_name = 'The Three Musketeers' AND name = 'Aramis';
UPDATE special_cards SET set_number_foil = '247F' WHERE character_name = 'The Three Musketeers' AND name = 'Athos';
UPDATE special_cards SET set_number_foil = '248F' WHERE character_name = 'The Three Musketeers' AND name = 'D''Artagnan';
UPDATE special_cards SET set_number_foil = '249F' WHERE character_name = 'The Three Musketeers' AND name = 'Porthos';
UPDATE special_cards SET set_number_foil = '250F' WHERE character_name = 'The Three Musketeers' AND name = 'Valiant Charge';

-- Special Cards - Time Traveler
UPDATE special_cards SET set_number_foil = '252F' WHERE character_name = 'Time Traveler' AND name = 'From a Mile Away';
UPDATE special_cards SET set_number_foil = '253F' WHERE character_name = 'Time Traveler' AND name = 'Futuristic Phaser';
UPDATE special_cards SET set_number_foil = '254F' WHERE character_name = 'Time Traveler' AND name = 'I''ll Already Be Gone';
UPDATE special_cards SET set_number_foil = '256F' WHERE character_name = 'Time Traveler' AND name = 'Harbinger''s Warning';
UPDATE special_cards SET set_number_foil = '257F' WHERE character_name = 'Time Traveler' AND name = 'The Tomorrow Doctor';

-- Special Cards - Victory Harben
UPDATE special_cards SET set_number_foil = '266F' WHERE character_name = 'Victory Harben' AND name = 'Abner Perry''s Lab Assistant';
UPDATE special_cards SET set_number_foil = '267F' WHERE character_name = 'Victory Harben' AND name = 'Archery, Knives & Jujitsu';
UPDATE special_cards SET set_number_foil = '268F' WHERE character_name = 'Victory Harben' AND name = 'Chamston-Hedding Estate';
UPDATE special_cards SET set_number_foil = '269F' WHERE character_name = 'Victory Harben' AND name = 'Department of Theoretical Physics';
UPDATE special_cards SET set_number_foil = '271F' WHERE character_name = 'Victory Harben' AND name = 'Practical Physics';

-- Special Cards - Zeus
UPDATE special_cards SET set_number_foil = '280F' WHERE character_name = 'Zeus' AND name = 'A Jealous God';
UPDATE special_cards SET set_number_foil = '281F' WHERE character_name = 'Zeus' AND name = 'Banishment';
UPDATE special_cards SET set_number_foil = '282F' WHERE character_name = 'Zeus' AND name = 'Hera';
UPDATE special_cards SET set_number_foil = '283F' WHERE character_name = 'Zeus' AND name = 'Law and Order';
UPDATE special_cards SET set_number_foil = '284F' WHERE character_name = 'Zeus' AND name = 'Thunderbolt';

-- Special Cards - Zorro
UPDATE special_cards SET set_number_foil = '287F' WHERE character_name = 'Zorro' AND name = 'Elite Swordsmanship';
UPDATE special_cards SET set_number_foil = '288F' WHERE character_name = 'Zorro' AND name = 'Master of Escape';
UPDATE special_cards SET set_number_foil = '289F' WHERE character_name = 'Zorro' AND name = 'Rapier';
UPDATE special_cards SET set_number_foil = '290F' WHERE character_name = 'Zorro' AND name = 'Riches of Don Diego de la Vega';
UPDATE special_cards SET set_number_foil = '291F' WHERE character_name = 'Zorro' AND name = 'Riposte';

-- Power Cards - Any-Power and MultiPower
UPDATE power_cards SET set_number_foil = '473F' WHERE name = '5 - Any-Power' AND power_type = 'Any-Power' AND value = 5;
UPDATE power_cards SET set_number_foil = '474F' WHERE name = '6 - Any-Power' AND power_type = 'Any-Power' AND value = 6;
UPDATE power_cards SET set_number_foil = '475F' WHERE name = '7 - Any-Power' AND power_type = 'Any-Power' AND value = 7;
UPDATE power_cards SET set_number_foil = '476F' WHERE name = '8 - Any-Power' AND power_type = 'Any-Power' AND value = 8;
UPDATE power_cards SET set_number_foil = '477F' WHERE name = '3 - Multi Power' AND power_type = 'Multi Power' AND value = 3;
UPDATE power_cards SET set_number_foil = '478F' WHERE name = '4 - Multi Power' AND power_type = 'Multi Power' AND value = 4;
UPDATE power_cards SET set_number_foil = '479F' WHERE name = '5 - Multi Power' AND power_type = 'Multi Power' AND value = 5;

-- Alternate Art Character Cards
-- Match by character name and image_path containing /alternate/
-- For characters with multiple alternates, matching one per set_number_foil (using LIMIT 1)
-- Using subquery to limit to one match per UPDATE
UPDATE characters SET set_number_foil = '482F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Angry Mob (Middle Ages)' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '483F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Angry Mob (Industrial Age)' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '484F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Angry Mob (Modern Age)' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '485F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Anubis' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '486F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Billy the Kid' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '487F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Carson of Venus' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '488F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Count of Monte Cristo' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '489F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Cthulhu' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '490F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Cthulhu' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '491F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dejah Thoris' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '492F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dejah Thoris' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '493F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dr. Watson' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '494F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dracula' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '495F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Headless Horseman' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '496F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Hercules' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '497F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Hercules' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '498F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Invisible Man' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '499F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Jane Porter' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '500F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Jane Porter' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '501F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Joan of Arc' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '502F' 
WHERE id = (SELECT id FROM characters WHERE name = 'John Carter of Mars' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '503F' 
WHERE id = (SELECT id FROM characters WHERE name = 'King Arthur' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '504F' 
WHERE id = (SELECT id FROM characters WHERE name = 'King Arthur' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '505F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Korak' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '506F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Korak' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '507F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Lancelot' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '508F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Leonidas' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '509F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Mina Harker' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '510F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Mina Harker' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '511F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Morgan le Fay' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '512F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Morgan le Fay' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '513F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Mr. Hyde' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '514F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Poseidon' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '515F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Professor Moriarty' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '516F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Ra' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '517F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Robin Hood' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '518F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sheriff of Nottingham' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '519F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sherlock Holmes' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '520F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sun Wukong' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '521F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tars Tarkas' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '522F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tarzan' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '523F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Merlin' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '524F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tarzan' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '525F' 
WHERE id = (SELECT id FROM characters WHERE name = 'The Mummy' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '526F' 
WHERE id = (SELECT id FROM characters WHERE name = 'The Three Musketeers' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '527F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Time Traveler' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '528F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Time Traveler' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '529F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Van Helsing' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '530F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Victory Harben' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '531F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Victory Harben' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '532F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Wicked Witch of the West' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '533F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Zeus' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '534F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Zorro' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);
UPDATE characters SET set_number_foil = '535F' 
WHERE id = (SELECT id FROM characters WHERE name = 'Zorro' AND image_path LIKE '%/alternate/%' AND set_number_foil IS NULL LIMIT 1);

