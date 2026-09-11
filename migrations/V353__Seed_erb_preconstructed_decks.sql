-- Seed the four official ERB preconstructed decks from
-- ERB Starter Decks.xlsx. Card rows resolve by set code + collector number +
-- non-foil status so environment-specific card UUIDs are never embedded.
-- The workbook's row order is retained as deck_cards.display_order.

CREATE TEMP TABLE tmp_preconstructed_source_erb (
    deck_id UUID NOT NULL,
    card_order INTEGER NOT NULL,
    set_number VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    source_label TEXT NOT NULL,
    PRIMARY KEY (deck_id, card_order)
) ON COMMIT DROP;

INSERT INTO tmp_preconstructed_source_erb (
    deck_id, card_order, set_number, quantity, source_label
) VALUES
    ('a3530001-0000-4000-8000-000000000001'::uuid, 1, '076', 1, 'Headless Horseman Character Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 2, '078', 1, 'Headless Horseman - Human Spine Whip'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 3, '079', 1, 'Headless Horseman - Mark of the Headless'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 4, '080', 1, 'Headless Horseman - Pumpkin Head'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 5, '081', 1, 'Headless Horseman - Relentless Hessian'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 6, '237', 1, 'The Mummy Character Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 7, '238', 1, 'The Mummy - Ancient Wisdom'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 8, '242', 1, 'The Mummy - Relentless Pursuit'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 9, '243', 1, 'The Mummy - The Eternal Journey'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 10, '240', 1, 'The Mummy - Pharaoh of the Fourth Dynasty'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 11, '048', 1, 'Cthulhu Character Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 12, '049', 1, 'Cthulhu - Ancient One'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 13, '054', 1, 'Cthulhu - The Sleeper Awakens'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 14, '052', 1, 'Cthulhu - Network of Fanatics'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 15, '153', 1, 'Mina Harker Character Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 16, '154', 1, 'Mina Harker - Dracula''s Telepathic Connection'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 17, '157', 1, 'Mina Harker - The Hunger'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 18, '362', 1, 'Mission Card (1 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 19, '363', 1, 'Mission Card (2 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 20, '364', 1, 'Mission Card (3 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 21, '365', 1, 'Mission Card (4 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 22, '366', 1, 'Mission Card (5 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 23, '367', 1, 'Mission Card (6 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 24, '368', 1, 'Mission Card (7 of 7) - Tarzan King of the Jungle - Mission Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 25, '369', 1, 'Event 1 - The Lost City of Opar - Event Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 26, '370', 1, 'Event 2 - Tarzan The Terrible - Event Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 27, '371', 1, 'Event 3 - The Power of Gonfal - Event Set: Tarzan of the Jungle'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 28, '307', 2, '1 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 29, '323', 1, '1 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 30, '306', 2, '2 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 31, '322', 1, '2 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 32, '297', 3, '3 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 33, '296', 3, '4 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 34, '295', 3, '5 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 35, '294', 1, '6 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 36, '310', 2, '6 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 37, '309', 3, '7 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 38, '308', 3, '8 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 39, '338', 1, '6 Brute Force +2 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 40, '339', 1, '6 Brute Force +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 41, '340', 1, '7 Brute Force +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 42, '329', 1, '7 Brute Force, or higher, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 43, '330', 1, '5 Intelligence or less, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 44, '344', 1, '5 Energy, 5 Combat, +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000001'::uuid, 45, '346', 1, '5 Energy, 5 Intelligence +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 1, '285', 1, 'Zorro Character Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 2, '286', 1, 'Zorro - 3 Quick Strokes'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 3, '287', 1, 'Zorro - Elite Swordsmanship'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 4, '288', 1, 'Zorro - Master of Escape'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 5, '291', 1, 'Zorro - Riposte'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 6, '111', 1, 'John Carter of Mars Character Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 7, '112', 1, 'John Carter of Mars - Dotar Sojat'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 8, '113', 1, 'John Carter of Mars - Immortality'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 9, '116', 1, 'John Carter of Mars - Superhuman Endurance'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 10, '117', 1, 'John Carter of Mars - Virginia Fighting Man'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 11, '244', 1, 'The Three Musketeers Character Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 12, '246', 1, 'The Three Musketeers - Aramis'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 13, '247', 1, 'The Three Musketeers - Athos'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 14, '250', 1, 'The Three Musketeers - Valiant Charge'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 15, '021', 1, 'Billy The Kid Character Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 16, '023', 1, 'Billy The Kid - I’ll Make you Famous'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 17, '027', 1, 'Billy The Kid - Regulators'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 18, '350', 1, 'Mission Card (1 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 19, '351', 1, 'Mission Card (2 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 20, '352', 1, 'Mission Card (3 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 21, '353', 1, 'Mission Card (4 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 22, '354', 1, 'Mission Card (5 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 23, '355', 1, 'Mission Card (6 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 24, '356', 1, 'Mission Card (7 of 7) - Call of Cthulhu - Mission Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 25, '357', 1, 'Event 1 - Desperate Gamble - Event Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 26, '358', 1, 'Event 2 - The Cost of Knowledge is Sanity - Event Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 27, '359', 1, 'Event 3 - Stars Align - Event Set: Call of Cthulhu'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 28, '311', 2, '5 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 29, '312', 2, '4 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 30, '313', 1, '3 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 31, '314', 1, '2 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 32, '315', 1, '1 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 33, '298', 2, '2 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 34, '299', 2, '1 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 35, '319', 1, '5 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 36, '320', 1, '4 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 37, '321', 2, '3 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 38, '300', 3, '8 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 39, '301', 3, '7 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 40, '302', 3, '6 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 41, '335', 1, '6 Combat +2 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 42, '336', 1, '6 Combat +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 43, '337', 1, '7 Combat +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 44, '327', 1, '7 Combat, or higher, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 45, '328', 1, '5 Brute Force or less, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 46, '349', 1, '5 Brute Force, 5 Intelligence +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000002'::uuid, 47, '346', 1, '5 Energy, 5 Intelligence +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 1, '279', 1, 'Zeus Character Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 2, '280', 1, 'Zeus - A Jealous God'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 3, '281', 1, 'Zeus - Banishment'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 4, '282', 1, 'Zeus - Hera'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 5, '284', 1, 'Zeus - Thunderbolt'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 6, '272', 1, 'Wicked Witch of the West Character Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 7, '273', 1, 'Wicked Witch of the West - Aquaphobic and Nyctophobic'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 8, '274', 1, 'Wicked Witch of the West - Feared by Other Witches'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 9, '275', 1, 'Wicked Witch of the West - I Will Have Those Silver Shoes!'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 10, '001', 1, 'Angry Mob: Middle Ages Character Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 11, '002', 1, 'Angry Mob - Don''t Let it Get Away!'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 12, '003', 1, 'Angry Mob - Mob Mentality'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 13, '005', 1, 'Angry Mob - Swarm Them!'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 14, '006', 1, 'Angry Mob: Middle Ages - Pitchforks and Torches'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 15, '055', 1, 'Dejah Thoris Character Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 16, '060', 1, 'Dejah Thoris - Protector of Barsoom'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 17, '386', 1, 'Mission Card (1 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 18, '387', 1, 'Mission Card (2 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 19, '388', 1, 'Mission Card (3 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 20, '389', 1, 'Mission Card (4 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 21, '390', 1, 'Mission Card (5 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 22, '391', 1, 'Mission Card (6 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 23, '392', 1, 'Mission Card (7 of 7) - World Legends - Mission Set: "Time Wars: Rise of the Gods" UV-GLOSS'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 24, '393', 1, 'Event 1 - Rally Our Allies - Event Set:  "Time Wars: Rise of the Gods"'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 25, '394', 1, 'Event 2 - Second Chances - Event Set:  "Time Wars: Rise of the Gods"'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 26, '395', 1, 'Event 3 - Heroes We Need - Event Set:  "Time Wars: Rise of the Gods"'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 27, '307', 1, '1 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 28, '323', 2, '1 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 29, '306', 1, '2 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 30, '322', 2, '2 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 31, '319', 2, '5 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 32, '304', 2, '4 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 33, '305', 3, '3 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 34, '310', 1, '6 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 35, '311', 1, '5 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 36, '312', 1, '4 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 37, '292', 3, '8 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 38, '293', 3, '7 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 39, '294', 2, '6 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 40, '332', 1, '6 Energy +2 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 41, '333', 1, '6 Energy +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 42, '334', 1, '7 Energy +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 43, '325', 1, '7 Energy, or higher, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 44, '326', 1, '5 Combat or less, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 45, '399', 1, '6 Energy +0/+1 Combat, Brute Force - Universe: Teamwork Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 46, '349', 1, '5 Brute Force, 5 Intelligence +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000003'::uuid, 47, '348', 1, '5 Combat, 5 Intelligence +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 1, '104', 1, 'Joan of Arc Character Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 2, '106', 1, 'Joan of Arc - Burned at the Stake'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 3, '108', 1, 'Joan of Arc - Inspirational Leadership'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 4, '110', 1, 'Joan of Arc - Protection of Saint Michael'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 5, '209', 1, 'Sherlock Holmes Character Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 6, '210', 1, 'Sherlock Holmes - Battle of Wits'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 7, '211', 1, 'Sherlock Holmes - Brilliant Deduction'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 8, '212', 1, 'Sherlock Holmes - Irene Adler'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 9, '215', 1, 'Sherlock Holmes - Unpredictable Mind'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 10, '251', 1, 'Time Traveler Character Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 11, '252', 1, 'Time Traveler - From a Mile Away'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 12, '253', 1, 'Time Traveler - Futuristic Phaser'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 13, '254', 1, 'Time Traveler - I''ll Already Be Gone'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 14, '257', 1, 'Time Traveler - The Tomorrow Doctor'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 15, '265', 1, 'Victory Harben Character Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 16, '266', 1, 'Victory Harben - Abner Perry''s Lab Assistant'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 17, '269', 1, 'Victory Harben - Department of Theoretical Physics'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 18, '374', 1, 'Mission Card (1 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 19, '375', 1, 'Mission Card (2 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 20, '376', 1, 'Mission Card (3 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 21, '377', 1, 'Mission Card (4 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 22, '378', 1, 'Mission Card (5 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 23, '379', 1, 'Mission Card (6 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 24, '380', 1, 'Mission Card (7 of 7) - John Carter - Warlord From Mars - Mission Set: John Carter - Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 25, '381', 1, 'Event 1  - Giant Man of Mars - Event Set:  Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 26, '382', 1, 'Event 2 - Battle With Zad - Event Set:  Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 27, '383', 1, 'Event 3 - Eyes in the Dark - Event Set:  Chronicles of Mars'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 28, '313', 2, '3 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 29, '314', 2, '2 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 30, '315', 2, '1 Brute Force - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 31, '298', 1, '2 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 32, '299', 1, '1 Energy - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 33, '304', 1, '4 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 34, '303', 3, '5 Combat - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 35, '316', 3, '8 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 36, '317', 3, '7 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 37, '318', 3, '6 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 38, '320', 2, '4 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 39, '321', 1, '3 Intelligence - Power Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 40, '341', 1, '6 Intelligence +2 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 41, '342', 1, '6 Intelligence +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 42, '343', 1, '7 Intelligence +3 - Universe: Basic Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 43, '324', 1, '5 Energy or less, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 44, '331', 1, '7 Intelligence, or higher, To Use - Universe: Ally Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 45, '345', 1, '5 Energy, 5 Brute Force +4 - Universe: Training Card'),
    ('a3530001-0000-4000-8000-000000000004'::uuid, 46, '347', 1, '5 Combat, 5 Brute Force +4 - Universe: Training Card');

CREATE TEMP TABLE tmp_preconstructed_catalog_erb ON COMMIT DROP AS
SELECT id::text AS card_id, 'character' AS card_type, set_number
    FROM characters
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
      AND NOT (set_number = '244' AND image_path LIKE '%/alternate/%')
    UNION ALL
    SELECT id::text AS card_id, 'special' AS card_type, set_number
    FROM special_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'location' AS card_type, set_number
    FROM locations
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'mission' AS card_type, set_number
    FROM missions
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'event' AS card_type, set_number
    FROM events
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'aspect' AS card_type, set_number
    FROM aspects
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'advanced-universe' AS card_type, set_number
    FROM advanced_universe_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'teamwork' AS card_type, set_number
    FROM teamwork_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'ally-universe' AS card_type, set_number
    FROM ally_universe_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'training' AS card_type, set_number
    FROM training_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'basic-universe' AS card_type, set_number
    FROM basic_universe_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'power' AS card_type, set_number
    FROM power_cards
    WHERE set = 'ERB' AND COALESCE(is_foil, FALSE) = FALSE;

DO $$
DECLARE
    precon_user_id UUID;
    unresolved TEXT;
    inserted_card_rows INTEGER;
BEGIN
    SELECT id INTO STRICT precon_user_id
    FROM users
    WHERE username = 'precon_decks';

    IF EXISTS (
        SELECT 1
        FROM decks
        WHERE id IN (
            SELECT deck_id FROM tmp_preconstructed_source_erb
        )
           OR (user_id = precon_user_id AND name IN ('Horror Menagerie', 'The Resistance', 'Ungodly Power', 'Time Detectives'))
    ) THEN
        RAISE EXCEPTION 'ERB preconstructed deck target already exists';
    END IF;

    IF (SELECT COUNT(*) FROM tmp_preconstructed_source_erb) <> 185
       OR (SELECT SUM(quantity) FROM tmp_preconstructed_source_erb) <> 232
       OR EXISTS (
           SELECT 1
           FROM (
               SELECT deck_id, SUM(quantity) AS card_total
               FROM tmp_preconstructed_source_erb
               GROUP BY deck_id
           ) totals
           WHERE card_total <> 58
       ) THEN
        RAISE EXCEPTION 'ERB workbook manifest count drift';
    END IF;

    SELECT string_agg(
        format('%s #%s (%s matches)', s.source_label, s.set_number, matched.match_count),
        '; ' ORDER BY s.deck_id, s.card_order
    )
    INTO unresolved
    FROM tmp_preconstructed_source_erb s
    CROSS JOIN LATERAL (
        SELECT COUNT(*) AS match_count
        FROM tmp_preconstructed_catalog_erb c
        WHERE c.set_number = s.set_number
    ) matched
    WHERE matched.match_count <> 1;

    IF unresolved IS NOT NULL THEN
        RAISE EXCEPTION 'ERB preconstructed card resolution failed: %', unresolved;
    END IF;

    INSERT INTO decks (
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        is_private,
        is_limited,
        is_valid,
        card_count,
        threat,
        reserve_character
    ) VALUES
        ('a3530001-0000-4000-8000-000000000001'::uuid, precon_user_id, 'Horror Menagerie', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL),
        ('a3530001-0000-4000-8000-000000000002'::uuid, precon_user_id, 'The Resistance', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL),
        ('a3530001-0000-4000-8000-000000000003'::uuid, precon_user_id, 'Ungodly Power', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL),
        ('a3530001-0000-4000-8000-000000000004'::uuid, precon_user_id, 'Time Detectives', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL);

    INSERT INTO preconstructed_decks (
        deck_id, set_code, set_label, release_order, deck_order
    )
    SELECT
        manifest.deck_id,
        'ERB',
        'ERB',
        1,
        manifest.deck_order
    FROM (VALUES
        ('a3530001-0000-4000-8000-000000000001'::uuid, 'Horror Menagerie', 1),
        ('a3530001-0000-4000-8000-000000000002'::uuid, 'The Resistance', 2),
        ('a3530001-0000-4000-8000-000000000003'::uuid, 'Ungodly Power', 3),
        ('a3530001-0000-4000-8000-000000000004'::uuid, 'Time Detectives', 4)
    ) AS manifest(deck_id, deck_name, deck_order);

    INSERT INTO deck_cards (
        deck_id, card_type, card_id, quantity, display_order
    )
    SELECT
        source.deck_id,
        catalog.card_type,
        catalog.card_id,
        source.quantity,
        source.card_order
    FROM tmp_preconstructed_source_erb source
    JOIN tmp_preconstructed_catalog_erb catalog
      ON catalog.set_number = source.set_number
    ORDER BY source.deck_id, source.card_order;

    GET DIAGNOSTICS inserted_card_rows = ROW_COUNT;
    IF inserted_card_rows <> 185 THEN
        RAISE EXCEPTION 'Expected 185 ERB deck-card rows, inserted %', inserted_card_rows;
    END IF;

    UPDATE decks
    SET is_private = FALSE,
        is_limited = TRUE,
        is_valid = TRUE
    WHERE id IN (SELECT deck_id FROM tmp_preconstructed_source_erb);

    IF (SELECT COUNT(*) FROM preconstructed_decks WHERE set_code = 'ERB') <> 4
       OR (SELECT COUNT(*) FROM decks WHERE user_id = precon_user_id AND name IN ('Horror Menagerie', 'The Resistance', 'Ungodly Power', 'Time Detectives')) <> 4
       OR (SELECT COUNT(*) FROM deck_cards WHERE deck_id IN (
             SELECT deck_id FROM preconstructed_decks WHERE set_code = 'ERB'
           )) <> 185
       OR (SELECT SUM(quantity) FROM deck_cards WHERE deck_id IN (
             SELECT deck_id FROM preconstructed_decks WHERE set_code = 'ERB'
           )) <> 232
       OR EXISTS (
           SELECT 1
           FROM decks d
           JOIN preconstructed_decks pd ON pd.deck_id = d.id
           WHERE pd.set_code = 'ERB'
             AND (d.user_id <> precon_user_id OR d.is_private OR NOT d.is_limited)
       ) THEN
        RAISE EXCEPTION 'ERB preconstructed deck verification failed';
    END IF;
END $$;
