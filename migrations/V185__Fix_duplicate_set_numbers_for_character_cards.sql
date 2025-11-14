-- Fix duplicate set_numbers for character cards
-- Issue: Regular character card updates matched all rows including alternate art cards
-- Solution: Clear set_number from alternate art cards, then re-apply with correct matching

-- Step 1: Clear set_number from all alternate art cards (they got wrong numbers from regular card updates)
UPDATE characters 
SET set_number = NULL 
WHERE image_path LIKE '%/alternate/%';

-- Step 2: Re-apply set_number to regular character cards (excluding alternates)
UPDATE characters SET set_number = '001' WHERE name = 'Angry Mob (Middle Ages)' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '008' WHERE name = 'Angry Mob (Industrial Age)' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '011' WHERE name = 'Angry Mob (Modern Age)' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '014' WHERE name = 'Anubis' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '021' WHERE name = 'Billy the Kid' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '028' WHERE name = 'Captain Nemo' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '035' WHERE name = 'Carson of Venus' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '042' WHERE name = 'Count of Monte Cristo' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '048' WHERE name = 'Cthulhu' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '055' WHERE name = 'Dejah Thoris' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '062' WHERE name = 'Dr. Watson' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '069' WHERE name = 'Dracula' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '076' WHERE name = 'Headless Horseman' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '083' WHERE name = 'Hercules' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '090' WHERE name = 'Invisible Man' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '097' WHERE name = 'Jane Porter' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '104' WHERE name = 'Joan of Arc' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '111' WHERE name = 'John Carter of Mars' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '118' WHERE name = 'King Arthur' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '125' WHERE name = 'Korak' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '132' WHERE name = 'Lancelot' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '139' WHERE name = 'Leonidas' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '146' WHERE name = 'Merlin' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '153' WHERE name = 'Mina Harker' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '160' WHERE name = 'Morgan le Fay' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '167' WHERE name = 'Mr. Hyde' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '174' WHERE name = 'Poseidon' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '181' WHERE name = 'Professor Moriarty' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '188' WHERE name = 'Ra' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '195' WHERE name = 'Robin Hood' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '202' WHERE name = 'Sheriff of Nottingham' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '209' WHERE name = 'Sherlock Holmes' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '216' WHERE name = 'Sun Wukong' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '223' WHERE name = 'Tars Tarkas' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '230' WHERE name = 'Tarzan' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '237' WHERE name = 'The Mummy' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '244' WHERE name = 'The Three Musketeers' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '251' WHERE name = 'Time Traveler' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '258' WHERE name = 'Van Helsing' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '265' WHERE name = 'Victory Harben' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '272' WHERE name = 'Wicked Witch of the West' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '279' WHERE name = 'Zeus' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);
UPDATE characters SET set_number = '285' WHERE name = 'Zorro' AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);

-- Step 3: Re-apply set_number to alternate art character cards
UPDATE characters SET set_number = '482' 
WHERE id = (SELECT id FROM characters WHERE name = 'Angry Mob (Middle Ages)' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '483' 
WHERE id = (SELECT id FROM characters WHERE name = 'Angry Mob (Industrial Age)' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '484' 
WHERE id = (SELECT id FROM characters WHERE name = 'Angry Mob (Modern Age)' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '485' 
WHERE id = (SELECT id FROM characters WHERE name = 'Anubis' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '486' 
WHERE id = (SELECT id FROM characters WHERE name = 'Billy the Kid' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
-- Skipping Captain Nemo (?) - no set_number assigned
UPDATE characters SET set_number = '487' 
WHERE id = (SELECT id FROM characters WHERE name = 'Carson of Venus' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '488' 
WHERE id = (SELECT id FROM characters WHERE name = 'Count of Monte Cristo' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '489' 
WHERE id = (SELECT id FROM characters WHERE name = 'Cthulhu' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '490' 
WHERE id = (SELECT id FROM characters WHERE name = 'Cthulhu' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '491' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dejah Thoris' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '492' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dejah Thoris' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '493' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dr. Watson' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '494' 
WHERE id = (SELECT id FROM characters WHERE name = 'Dracula' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '495' 
WHERE id = (SELECT id FROM characters WHERE name = 'Headless Horseman' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '496' 
WHERE id = (SELECT id FROM characters WHERE name = 'Hercules' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '497' 
WHERE id = (SELECT id FROM characters WHERE name = 'Hercules' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '498' 
WHERE id = (SELECT id FROM characters WHERE name = 'Invisible Man' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '499' 
WHERE id = (SELECT id FROM characters WHERE name = 'Jane Porter' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '500' 
WHERE id = (SELECT id FROM characters WHERE name = 'Jane Porter' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '501' 
WHERE id = (SELECT id FROM characters WHERE name = 'Joan of Arc' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '502' 
WHERE id = (SELECT id FROM characters WHERE name = 'John Carter of Mars' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '503' 
WHERE id = (SELECT id FROM characters WHERE name = 'King Arthur' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '504' 
WHERE id = (SELECT id FROM characters WHERE name = 'King Arthur' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '505' 
WHERE id = (SELECT id FROM characters WHERE name = 'Korak' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '506' 
WHERE id = (SELECT id FROM characters WHERE name = 'Korak' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '507' 
WHERE id = (SELECT id FROM characters WHERE name = 'Lancelot' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '508' 
WHERE id = (SELECT id FROM characters WHERE name = 'Leonidas' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '509' 
WHERE id = (SELECT id FROM characters WHERE name = 'Mina Harker' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '510' 
WHERE id = (SELECT id FROM characters WHERE name = 'Mina Harker' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '511' 
WHERE id = (SELECT id FROM characters WHERE name = 'Morgan le Fay' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '512' 
WHERE id = (SELECT id FROM characters WHERE name = 'Morgan le Fay' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '513' 
WHERE id = (SELECT id FROM characters WHERE name = 'Mr. Hyde' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '514' 
WHERE id = (SELECT id FROM characters WHERE name = 'Poseidon' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '515' 
WHERE id = (SELECT id FROM characters WHERE name = 'Professor Moriarty' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '516' 
WHERE id = (SELECT id FROM characters WHERE name = 'Ra' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '517' 
WHERE id = (SELECT id FROM characters WHERE name = 'Robin Hood' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '518' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sheriff of Nottingham' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '519' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sherlock Holmes' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '520' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sun Wukong' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '521' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tars Tarkas' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '522' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tarzan' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '523' 
WHERE id = (SELECT id FROM characters WHERE name = 'Merlin' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '524' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tarzan' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '525' 
WHERE id = (SELECT id FROM characters WHERE name = 'The Mummy' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '526' 
WHERE id = (SELECT id FROM characters WHERE name = 'The Three Musketeers' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '527' 
WHERE id = (SELECT id FROM characters WHERE name = 'Time Traveler' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '528' 
WHERE id = (SELECT id FROM characters WHERE name = 'Time Traveler' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '529' 
WHERE id = (SELECT id FROM characters WHERE name = 'Van Helsing' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '530' 
WHERE id = (SELECT id FROM characters WHERE name = 'Victory Harben' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '531' 
WHERE id = (SELECT id FROM characters WHERE name = 'Victory Harben' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '532' 
WHERE id = (SELECT id FROM characters WHERE name = 'Wicked Witch of the West' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '533' 
WHERE id = (SELECT id FROM characters WHERE name = 'Zeus' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '534' 
WHERE id = (SELECT id FROM characters WHERE name = 'Zorro' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '535' 
WHERE id = (SELECT id FROM characters WHERE name = 'Zorro' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '536' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tarzan' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '537' 
WHERE id = (SELECT id FROM characters WHERE name = 'Tars Tarkas' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '538' 
WHERE id = (SELECT id FROM characters WHERE name = 'The Three Musketeers' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '539' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sherlock Holmes' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '540' 
WHERE id = (SELECT id FROM characters WHERE name = 'Anubis' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '541' 
WHERE id = (SELECT id FROM characters WHERE name = 'Van Helsing' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '542' 
WHERE id = (SELECT id FROM characters WHERE name = 'Sheriff of Nottingham' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '543' 
WHERE id = (SELECT id FROM characters WHERE name = 'Captain Nemo' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);
UPDATE characters SET set_number = '544' 
WHERE id = (SELECT id FROM characters WHERE name = 'Count of Monte Cristo' AND image_path LIKE '%/alternate/%' AND set_number IS NULL LIMIT 1);

