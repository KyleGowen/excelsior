-- Populate set_number column for character cards and special cards
-- Format: 3-digit number only (e.g., 001, 002) - set identifier is ERB
--
-- Characters
UPDATE characters SET set_number = '001' WHERE name = 'Angry Mob (Middle Ages)';
UPDATE characters SET set_number = '008' WHERE name = 'Angry Mob (Industrial Age)';
UPDATE characters SET set_number = '011' WHERE name = 'Angry Mob (Modern Age)';
UPDATE characters SET set_number = '014' WHERE name = 'Anubis';
UPDATE characters SET set_number = '021' WHERE name = 'Billy the Kid';
UPDATE characters SET set_number = '028' WHERE name = 'Captain Nemo';
UPDATE characters SET set_number = '035' WHERE name = 'Carson of Venus';
UPDATE characters SET set_number = '042' WHERE name = 'Count of Monte Cristo';
UPDATE characters SET set_number = '048' WHERE name = 'Cthulhu';
UPDATE characters SET set_number = '055' WHERE name = 'Dejah Thoris';
UPDATE characters SET set_number = '062' WHERE name = 'Dr. Watson';
UPDATE characters SET set_number = '069' WHERE name = 'Dracula';
UPDATE characters SET set_number = '076' WHERE name = 'Headless Horseman';
UPDATE characters SET set_number = '083' WHERE name = 'Hercules';
UPDATE characters SET set_number = '090' WHERE name = 'Invisible Man';
UPDATE characters SET set_number = '097' WHERE name = 'Jane Porter';
UPDATE characters SET set_number = '104' WHERE name = 'Joan of Arc';
UPDATE characters SET set_number = '111' WHERE name = 'John Carter of Mars';
UPDATE characters SET set_number = '118' WHERE name = 'King Arthur';
UPDATE characters SET set_number = '125' WHERE name = 'Korak';
UPDATE characters SET set_number = '132' WHERE name = 'Lancelot';
UPDATE characters SET set_number = '139' WHERE name = 'Leonidas';
UPDATE characters SET set_number = '146' WHERE name = 'Merlin';
UPDATE characters SET set_number = '153' WHERE name = 'Mina Harker';
UPDATE characters SET set_number = '160' WHERE name = 'Morgan le Fay';
UPDATE characters SET set_number = '167' WHERE name = 'Mr. Hyde';
UPDATE characters SET set_number = '174' WHERE name = 'Poseidon';
UPDATE characters SET set_number = '181' WHERE name = 'Professor Moriarty';
UPDATE characters SET set_number = '188' WHERE name = 'Ra';
UPDATE characters SET set_number = '195' WHERE name = 'Robin Hood';
UPDATE characters SET set_number = '202' WHERE name = 'Sheriff of Nottingham';
UPDATE characters SET set_number = '209' WHERE name = 'Sherlock Holmes';
UPDATE characters SET set_number = '216' WHERE name = 'Sun Wukong';
UPDATE characters SET set_number = '223' WHERE name = 'Tars Tarkas';
UPDATE characters SET set_number = '230' WHERE name = 'Tarzan';
UPDATE characters SET set_number = '237' WHERE name = 'The Mummy';
UPDATE characters SET set_number = '244' WHERE name = 'The Three Musketeers';
UPDATE characters SET set_number = '251' WHERE name = 'Time Traveler';
UPDATE characters SET set_number = '258' WHERE name = 'Van Helsing';
UPDATE characters SET set_number = '265' WHERE name = 'Victory Harben';
UPDATE characters SET set_number = '272' WHERE name = 'Wicked Witch of the West';
UPDATE characters SET set_number = '279' WHERE name = 'Zeus';
UPDATE characters SET set_number = '285' WHERE name = 'Zorro';

-- Special Cards - Angry Mob
UPDATE special_cards SET set_number = '002' WHERE character_name = 'Angry Mob' AND name = 'Don''t Let it Get Away!';
UPDATE special_cards SET set_number = '003' WHERE character_name = 'Angry Mob' AND name = 'Mob Mentality';
UPDATE special_cards SET set_number = '004' WHERE character_name = 'Angry Mob' AND name = 'Strength in Numbers';
UPDATE special_cards SET set_number = '005' WHERE character_name = 'Angry Mob' AND name = 'Swarm Them!';
UPDATE special_cards SET set_number = '006' WHERE character_name = 'Angry Mob' AND name = 'Pitchforks and Torches';
UPDATE special_cards SET set_number = '007' WHERE character_name = 'Angry Mob' AND name = 'Regent of the Crown';
UPDATE special_cards SET set_number = '009' WHERE character_name = 'Angry Mob' AND name = 'Disrupting Supply Lines';
UPDATE special_cards SET set_number = '010' WHERE character_name = 'Angry Mob' AND name = 'Union Power';
UPDATE special_cards SET set_number = '012' WHERE character_name = 'Angry Mob' AND name = 'Online Cyber Attack';
UPDATE special_cards SET set_number = '013' WHERE character_name = 'Angry Mob' AND name = 'Ransom Your Secrets';

-- Special Cards - Anubis
UPDATE special_cards SET set_number = '015' WHERE character_name = 'Anubis' AND name = 'Book of the Dead';
UPDATE special_cards SET set_number = '016' WHERE character_name = 'Anubis' AND name = 'Lord of the Sacred Land';
UPDATE special_cards SET set_number = '017' WHERE character_name = 'Anubis' AND name = 'Shepherd of the Damned';
UPDATE special_cards SET set_number = '018' WHERE character_name = 'Anubis' AND name = 'Siphon Strike';
UPDATE special_cards SET set_number = '019' WHERE character_name = 'Anubis' AND name = 'Weighing of the Heart';
UPDATE special_cards SET set_number = '020' WHERE character_name = 'Anubis' AND name = 'Wither';

-- Special Cards - Billy the Kid
UPDATE special_cards SET set_number = '022' WHERE character_name = 'Billy the Kid' AND name = 'Head for Mexico';
UPDATE special_cards SET set_number = '023' WHERE character_name = 'Billy the Kid' AND name = 'I''ll Make You Famous';
UPDATE special_cards SET set_number = '024' WHERE character_name = 'Billy the Kid' AND name = 'Pals';
UPDATE special_cards SET set_number = '025' WHERE character_name = 'Billy the Kid' AND name = 'Quick Draw';
UPDATE special_cards SET set_number = '026' WHERE character_name = 'Billy the Kid' AND name = 'Reap the Whirlwind';
UPDATE special_cards SET set_number = '027' WHERE character_name = 'Billy the Kid' AND name = 'Regulators';

-- Special Cards - Captain Nemo
UPDATE special_cards SET set_number = '029' WHERE character_name = 'Captain Nemo' AND name = 'Ethnologist';
UPDATE special_cards SET set_number = '030' WHERE character_name = 'Captain Nemo' AND name = 'Never Set Foot On Dry Land';
UPDATE special_cards SET set_number = '031' WHERE character_name = 'Captain Nemo' AND name = 'Silent Running';
UPDATE special_cards SET set_number = '032' WHERE character_name = 'Captain Nemo' AND name = 'Ruthless Plunderer';
UPDATE special_cards SET set_number = '033' WHERE character_name = 'Captain Nemo' AND name = 'The Nautilus';
UPDATE special_cards SET set_number = '034' WHERE character_name = 'Captain Nemo' AND name = 'Weapons of Wrath and Hatred';

-- Special Cards - Carson of Venus
UPDATE special_cards SET set_number = '036' WHERE character_name = 'Carson of Venus' AND name = 'Janjong Duare Mintep';
UPDATE special_cards SET set_number = '037' WHERE character_name = 'Carson of Venus' AND name = 'On the Razor''s Edge';
UPDATE special_cards SET set_number = '038' WHERE character_name = 'Carson of Venus' AND name = 'Telepathic Resistance';
UPDATE special_cards SET set_number = '039' WHERE character_name = 'Carson of Venus' AND name = 'Sometimes Piracy is the Best Option';
UPDATE special_cards SET set_number = '040' WHERE character_name = 'Carson of Venus' AND name = 'T-Ray Gun';
UPDATE special_cards SET set_number = '041' WHERE character_name = 'Carson of Venus' AND name = 'Telepathic Training';

-- Special Cards - Count of Monte Cristo
UPDATE special_cards SET set_number = '043' WHERE character_name = 'Count of Monte Cristo' AND name = 'Friend to Foe';
UPDATE special_cards SET set_number = '044' WHERE character_name = 'Count of Monte Cristo' AND name = 'Jacopo';
UPDATE special_cards SET set_number = '045' WHERE character_name = 'Count of Monte Cristo' AND name = 'Network of Thieves';
UPDATE special_cards SET set_number = '046' WHERE character_name = 'Count of Monte Cristo' AND name = 'Surprise Swordsman';
UPDATE special_cards SET set_number = '047' WHERE character_name = 'Count of Monte Cristo' AND name = 'Unlimited Resources';

-- Special Cards - Cthulhu
UPDATE special_cards SET set_number = '049' WHERE character_name = 'Cthulhu' AND name = 'Ancient One';
UPDATE special_cards SET set_number = '050' WHERE character_name = 'Cthulhu' AND name = 'Devoted Follower';
UPDATE special_cards SET set_number = '051' WHERE character_name = 'Cthulhu' AND name = 'Distracting Intervention';
UPDATE special_cards SET set_number = '052' WHERE character_name = 'Cthulhu' AND name = 'Network of Fanatics';
UPDATE special_cards SET set_number = '053' WHERE character_name = 'Cthulhu' AND name = 'The Call of Cthulhu';
UPDATE special_cards SET set_number = '054' WHERE character_name = 'Cthulhu' AND name = 'The Sleeper Awakens';

-- Special Cards - Dejah Thoris
UPDATE special_cards SET set_number = '056' WHERE character_name = 'Dejah Thoris' AND name = 'Warrior of Helium';
UPDATE special_cards SET set_number = '057' WHERE character_name = 'Dejah Thoris' AND name = 'Diplomat to All Martians';
UPDATE special_cards SET set_number = '058' WHERE character_name = 'Dejah Thoris' AND name = 'Fortune of Helium';
UPDATE special_cards SET set_number = '059' WHERE character_name = 'Dejah Thoris' AND name = 'Head of Martian Science';
UPDATE special_cards SET set_number = '060' WHERE character_name = 'Dejah Thoris' AND name = 'Protector of Barsoom';
UPDATE special_cards SET set_number = '061' WHERE character_name = 'Dejah Thoris' AND name = 'Champions of Barsoom';

-- Special Cards - Dr. Watson
UPDATE special_cards SET set_number = '063' WHERE character_name = 'Dr. Watson' AND name = 'All Chips on the Table';
UPDATE special_cards SET set_number = '064' WHERE character_name = 'Dr. Watson' AND name = 'Blackheath Rugby Star';
UPDATE special_cards SET set_number = '065' WHERE character_name = 'Dr. Watson' AND name = 'British Army Surgeon';
UPDATE special_cards SET set_number = '066' WHERE character_name = 'Dr. Watson' AND name = 'English Gentleman';
UPDATE special_cards SET set_number = '067' WHERE character_name = 'Dr. Watson' AND name = 'Not a Bad Detective';
UPDATE special_cards SET set_number = '068' WHERE character_name = 'Dr. Watson' AND name = 'Always there for a Friend';

-- Special Cards - Dracula
UPDATE special_cards SET set_number = '070' WHERE character_name = 'Dracula' AND name = 'Crimson Restoration';
UPDATE special_cards SET set_number = '071' WHERE character_name = 'Dracula' AND name = 'Veil of Deceit';
UPDATE special_cards SET set_number = '072' WHERE character_name = 'Dracula' AND name = 'Lord of the Vampires';
UPDATE special_cards SET set_number = '073' WHERE character_name = 'Dracula' AND name = 'Paralyzing Gaze';
UPDATE special_cards SET set_number = '074' WHERE character_name = 'Dracula' AND name = 'To the Last Man';
UPDATE special_cards SET set_number = '075' WHERE character_name = 'Dracula' AND name = 'Undead Flesh';

-- Special Cards - Headless Horseman
UPDATE special_cards SET set_number = '077' WHERE character_name = 'Headless Horseman' AND name = 'Decapitate';
UPDATE special_cards SET set_number = '078' WHERE character_name = 'Headless Horseman' AND name = 'Human Spine Whip';
UPDATE special_cards SET set_number = '079' WHERE character_name = 'Headless Horseman' AND name = 'Mark of the Headless';
UPDATE special_cards SET set_number = '080' WHERE character_name = 'Headless Horseman' AND name = 'Pumpkin Head';
UPDATE special_cards SET set_number = '081' WHERE character_name = 'Headless Horseman' AND name = 'Relentless Hessian';
UPDATE special_cards SET set_number = '082' WHERE character_name = 'Headless Horseman' AND name = 'Visage of Terror';

-- Special Cards - Hercules
UPDATE special_cards SET set_number = '084' WHERE character_name = 'Hercules' AND name = 'Sowing Chaos';
UPDATE special_cards SET set_number = '085' WHERE character_name = 'Hercules' AND name = 'Great Club';
UPDATE special_cards SET set_number = '086' WHERE character_name = 'Hercules' AND name = 'Lion Skin Cloak';
UPDATE special_cards SET set_number = '087' WHERE character_name = 'Hercules' AND name = 'Godly Prowess';
UPDATE special_cards SET set_number = '088' WHERE character_name = 'Hercules' AND name = 'Protector of Mankind';
UPDATE special_cards SET set_number = '089' WHERE character_name = 'Hercules' AND name = 'Slaying the Hydra';

-- Special Cards - Invisible Man
UPDATE special_cards SET set_number = '091' WHERE character_name = 'Invisible Man' AND name = 'Didn''t See it Coming';
UPDATE special_cards SET set_number = '092' WHERE character_name = 'Invisible Man' AND name = 'Hidden Sociopath';
UPDATE special_cards SET set_number = '093' WHERE character_name = 'Invisible Man' AND name = 'I''m In Your House';
UPDATE special_cards SET set_number = '094' WHERE character_name = 'Invisible Man' AND name = 'I''ve Murdered Before';
UPDATE special_cards SET set_number = '095' WHERE character_name = 'Invisible Man' AND name = 'One at a Time';
UPDATE special_cards SET set_number = '096' WHERE character_name = 'Invisible Man' AND name = 'Run and Hide';

-- Special Cards - Jane Porter
UPDATE special_cards SET set_number = '098' WHERE character_name = 'Jane Porter' AND name = 'Archimedes Q. Porter';
UPDATE special_cards SET set_number = '099' WHERE character_name = 'Jane Porter' AND name = 'Ethnoarchaeology';
UPDATE special_cards SET set_number = '100' WHERE character_name = 'Jane Porter' AND name = 'Tenacious Pursuit';
UPDATE special_cards SET set_number = '101' WHERE character_name = 'Jane Porter' AND name = 'Lady of the Jungle';
UPDATE special_cards SET set_number = '102' WHERE character_name = 'Jane Porter' AND name = 'Not without my Friends';
UPDATE special_cards SET set_number = '103' WHERE character_name = 'Jane Porter' AND name = 'Not a Damsel in Distress';

-- Special Cards - Joan of Arc
UPDATE special_cards SET set_number = '105' WHERE character_name = 'Joan of Arc' AND name = 'Angelic Visions';
UPDATE special_cards SET set_number = '106' WHERE character_name = 'Joan of Arc' AND name = 'Burned at the Stake';
UPDATE special_cards SET set_number = '107' WHERE character_name = 'Joan of Arc' AND name = 'Early Feminist Leader';
UPDATE special_cards SET set_number = '108' WHERE character_name = 'Joan of Arc' AND name = 'Inspirational Leadership';
UPDATE special_cards SET set_number = '109' WHERE character_name = 'Joan of Arc' AND name = 'Patron Saint of France';
UPDATE special_cards SET set_number = '110' WHERE character_name = 'Joan of Arc' AND name = 'Protection of Saint Michael';

-- Special Cards - John Carter of Mars
UPDATE special_cards SET set_number = '112' WHERE character_name = 'John Carter of Mars' AND name = 'Dotar Sojat';
UPDATE special_cards SET set_number = '113' WHERE character_name = 'John Carter of Mars' AND name = 'Immortality';
UPDATE special_cards SET set_number = '114' WHERE character_name = 'John Carter of Mars' AND name = 'Leap into the Fray';
UPDATE special_cards SET set_number = '115' WHERE character_name = 'John Carter of Mars' AND name = 'Lower Gravity';
UPDATE special_cards SET set_number = '116' WHERE character_name = 'John Carter of Mars' AND name = 'Superhuman Endurance';
UPDATE special_cards SET set_number = '117' WHERE character_name = 'John Carter of Mars' AND name = 'Virginia Fighting Man';

-- Special Cards - King Arthur
UPDATE special_cards SET set_number = '119' WHERE character_name = 'King Arthur' AND name = 'Excalibur';
UPDATE special_cards SET set_number = '120' WHERE character_name = 'King Arthur' AND name = 'King of Camelot';
UPDATE special_cards SET set_number = '121' WHERE character_name = 'King Arthur' AND name = 'Knights of the Round Table';
UPDATE special_cards SET set_number = '122' WHERE character_name = 'King Arthur' AND name = 'Legendary Partnership';
UPDATE special_cards SET set_number = '123' WHERE character_name = 'King Arthur' AND name = 'Heavy is the Head';
UPDATE special_cards SET set_number = '124' WHERE character_name = 'King Arthur' AND name = 'Lead from the Front';

-- Special Cards - Korak
UPDATE special_cards SET set_number = '126' WHERE character_name = 'Korak' AND name = 'John Clayton III';
UPDATE special_cards SET set_number = '127' WHERE character_name = 'Korak' AND name = 'Jungle Survival';
UPDATE special_cards SET set_number = '128' WHERE character_name = 'Korak' AND name = 'Like Father, Like Son';
UPDATE special_cards SET set_number = '129' WHERE character_name = 'Korak' AND name = 'Meriem and Jackie Clayton';
UPDATE special_cards SET set_number = '130' WHERE character_name = 'Korak' AND name = 'Son of the Jungle';
UPDATE special_cards SET set_number = '131' WHERE character_name = 'Korak' AND name = 'To The Death';

-- Special Cards - Lancelot
UPDATE special_cards SET set_number = '133' WHERE character_name = 'Lancelot' AND name = 'Chivalrous Protector';
UPDATE special_cards SET set_number = '134' WHERE character_name = 'Lancelot' AND name = 'For Guinevere''s Love';
UPDATE special_cards SET set_number = '135' WHERE character_name = 'Lancelot' AND name = 'For the Queen!';
UPDATE special_cards SET set_number = '136' WHERE character_name = 'Lancelot' AND name = 'Knight of the Round Table';
UPDATE special_cards SET set_number = '137' WHERE character_name = 'Lancelot' AND name = 'Sword and Shield';
UPDATE special_cards SET set_number = '138' WHERE character_name = 'Lancelot' AND name = 'True Strike';

-- Special Cards - Leonidas
UPDATE special_cards SET set_number = '140' WHERE character_name = 'Leonidas' AND name = '300';
UPDATE special_cards SET set_number = '141' WHERE character_name = 'Leonidas' AND name = 'Baptized in Combat';
UPDATE special_cards SET set_number = '142' WHERE character_name = 'Leonidas' AND name = 'For Sparta';
UPDATE special_cards SET set_number = '143' WHERE character_name = 'Leonidas' AND name = 'Give Them Nothing';
UPDATE special_cards SET set_number = '144' WHERE character_name = 'Leonidas' AND name = 'Greatest Soldiers in History';
UPDATE special_cards SET set_number = '145' WHERE character_name = 'Leonidas' AND name = 'Shield Phalanx';

-- Special Cards - Merlin
UPDATE special_cards SET set_number = '147' WHERE character_name = 'Merlin' AND name = 'Archimedes';
UPDATE special_cards SET set_number = '148' WHERE character_name = 'Merlin' AND name = 'Ascendant Mage';
UPDATE special_cards SET set_number = '149' WHERE character_name = 'Merlin' AND name = 'For Camelot!';
UPDATE special_cards SET set_number = '150' WHERE character_name = 'Merlin' AND name = 'Foretell the Future';
UPDATE special_cards SET set_number = '151' WHERE character_name = 'Merlin' AND name = 'Shapeshift';
UPDATE special_cards SET set_number = '152' WHERE character_name = 'Merlin' AND name = 'Summon the Elements';

-- Special Cards - Mina Harker
UPDATE special_cards SET set_number = '154' WHERE character_name = 'Mina Harker' AND name = 'Dracula''s Telepathic Connection';
UPDATE special_cards SET set_number = '155' WHERE character_name = 'Mina Harker' AND name = 'Jonathan Harker, Solicitor';
UPDATE special_cards SET set_number = '156' WHERE character_name = 'Mina Harker' AND name = 'Nocturnal Hunter';
UPDATE special_cards SET set_number = '157' WHERE character_name = 'Mina Harker' AND name = 'The Hunger';
UPDATE special_cards SET set_number = '158' WHERE character_name = 'Mina Harker' AND name = 'Tracking Movements';
UPDATE special_cards SET set_number = '159' WHERE character_name = 'Mina Harker' AND name = 'Vampiric Celerity';

-- Special Cards - Morgan le Fay
UPDATE special_cards SET set_number = '161' WHERE character_name = 'Morgan le Fay' AND name = 'Apprentice of Merlin';
UPDATE special_cards SET set_number = '162' WHERE character_name = 'Morgan le Fay' AND name = 'Avalon''s Warmth';
UPDATE special_cards SET set_number = '163' WHERE character_name = 'Morgan le Fay' AND name = 'Duality';
UPDATE special_cards SET set_number = '164' WHERE character_name = 'Morgan le Fay' AND name = 'Enchantress'' Guile';
UPDATE special_cards SET set_number = '165' WHERE character_name = 'Morgan le Fay' AND name = 'Shapeshifter''s Guise';
UPDATE special_cards SET set_number = '166' WHERE character_name = 'Morgan le Fay' AND name = 'Teleportation Circle';

-- Special Cards - Mr. Hyde
UPDATE special_cards SET set_number = '168' WHERE character_name = 'Mr. Hyde' AND name = 'Overdose';
UPDATE special_cards SET set_number = '169' WHERE character_name = 'Mr. Hyde' AND name = 'Sadistic Tendencies';
UPDATE special_cards SET set_number = '170' WHERE character_name = 'Mr. Hyde' AND name = 'Set Loose';
UPDATE special_cards SET set_number = '171' WHERE character_name = 'Mr. Hyde' AND name = 'The Serum';
UPDATE special_cards SET set_number = '172' WHERE character_name = 'Mr. Hyde' AND name = 'Trample';
UPDATE special_cards SET set_number = '173' WHERE character_name = 'Mr. Hyde' AND name = 'Victorian Sophisticant';

-- Special Cards - Poseidon
UPDATE special_cards SET set_number = '175' WHERE character_name = 'Poseidon' AND name = 'Reclaim the Water';
UPDATE special_cards SET set_number = '176' WHERE character_name = 'Poseidon' AND name = 'Form of Water';
UPDATE special_cards SET set_number = '177' WHERE character_name = 'Poseidon' AND name = 'Poseidon''s Might';
UPDATE special_cards SET set_number = '178' WHERE character_name = 'Poseidon' AND name = 'Rising Tides';
UPDATE special_cards SET set_number = '179' WHERE character_name = 'Poseidon' AND name = 'Trident';
UPDATE special_cards SET set_number = '180' WHERE character_name = 'Poseidon' AND name = 'Tsunami';

-- Special Cards - Professor Moriarty
UPDATE special_cards SET set_number = '182' WHERE character_name = 'Professor Moriarty' AND name = 'Complex Criminal Scheme';
UPDATE special_cards SET set_number = '183' WHERE character_name = 'Professor Moriarty' AND name = 'Criminal Mastermind';
UPDATE special_cards SET set_number = '184' WHERE character_name = 'Professor Moriarty' AND name = 'Future Plans';
UPDATE special_cards SET set_number = '185' WHERE character_name = 'Professor Moriarty' AND name = 'Mathematical Genius';
UPDATE special_cards SET set_number = '186' WHERE character_name = 'Professor Moriarty' AND name = 'Napoleon of Crime';
UPDATE special_cards SET set_number = '187' WHERE character_name = 'Professor Moriarty' AND name = 'Tactical Fighter';

-- Special Cards - Ra
UPDATE special_cards SET set_number = '189' WHERE character_name = 'Ra' AND name = 'Cult of Mnevis Bull';
UPDATE special_cards SET set_number = '190' WHERE character_name = 'Ra' AND name = 'Eye of Sekhmet';
UPDATE special_cards SET set_number = '191' WHERE character_name = 'Ra' AND name = 'Healing Waters of the Nile';
UPDATE special_cards SET set_number = '192' WHERE character_name = 'Ra' AND name = 'Shards of the Staff';
UPDATE special_cards SET set_number = '193' WHERE character_name = 'Ra' AND name = 'Staff Fragments';
UPDATE special_cards SET set_number = '194' WHERE character_name = 'Ra' AND name = 'Staff Head';

-- Special Cards - Robin Hood
UPDATE special_cards SET set_number = '196' WHERE character_name = 'Robin Hood' AND name = 'Band of Merry Men';
UPDATE special_cards SET set_number = '197' WHERE character_name = 'Robin Hood' AND name = 'Defender of the People';
UPDATE special_cards SET set_number = '198' WHERE character_name = 'Robin Hood' AND name = 'Hero of Nottingham';
UPDATE special_cards SET set_number = '199' WHERE character_name = 'Robin Hood' AND name = 'Master Archer';
UPDATE special_cards SET set_number = '200' WHERE character_name = 'Robin Hood' AND name = 'Master Thief';
UPDATE special_cards SET set_number = '201' WHERE character_name = 'Robin Hood' AND name = 'Steal from the Rich';

-- Special Cards - Sheriff of Nottingham
UPDATE special_cards SET set_number = '203' WHERE character_name = 'Sheriff of Nottingham' AND name = 'Flaming Arrows';
UPDATE special_cards SET set_number = '204' WHERE character_name = 'Sheriff of Nottingham' AND name = 'I Command an Army';
UPDATE special_cards SET set_number = '205' WHERE character_name = 'Sheriff of Nottingham' AND name = 'Read the Bones';
UPDATE special_cards SET set_number = '206' WHERE character_name = 'Sheriff of Nottingham' AND name = 'Rule by Fear';
UPDATE special_cards SET set_number = '207' WHERE character_name = 'Sheriff of Nottingham' AND name = 'Squeeze the Commoners';
UPDATE special_cards SET set_number = '208' WHERE character_name = 'Sheriff of Nottingham' AND name = 'Taxes';

-- Special Cards - Sherlock Holmes
UPDATE special_cards SET set_number = '210' WHERE character_name = 'Sherlock Holmes' AND name = 'Battle of Wits';
UPDATE special_cards SET set_number = '211' WHERE character_name = 'Sherlock Holmes' AND name = 'Brilliant Deduction';
UPDATE special_cards SET set_number = '212' WHERE character_name = 'Sherlock Holmes' AND name = 'Irene Adler';
UPDATE special_cards SET set_number = '213' WHERE character_name = 'Sherlock Holmes' AND name = 'Logical Reasoning';
UPDATE special_cards SET set_number = '214' WHERE character_name = 'Sherlock Holmes' AND name = 'Probability Evaluation';
UPDATE special_cards SET set_number = '215' WHERE character_name = 'Sherlock Holmes' AND name = 'Unpredictable Mind';

-- Special Cards - Sun Wukong
UPDATE special_cards SET set_number = '217' WHERE character_name = 'Sun Wukong' AND name = 'Cloud Surfing';
UPDATE special_cards SET set_number = '218' WHERE character_name = 'Sun Wukong' AND name = 'Godly Strength';
UPDATE special_cards SET set_number = '219' WHERE character_name = 'Sun Wukong' AND name = 'Grasp of the Five Elements';
UPDATE special_cards SET set_number = '220' WHERE character_name = 'Sun Wukong' AND name = 'Staff of the Monkey King';
UPDATE special_cards SET set_number = '221' WHERE character_name = 'Sun Wukong' AND name = 'Stone Skin';
UPDATE special_cards SET set_number = '222' WHERE character_name = 'Sun Wukong' AND name = 'Transformation Trickery';

-- Special Cards - Tars Tarkas
UPDATE special_cards SET set_number = '224' WHERE character_name = 'Tars Tarkas' AND name = 'Avenging My Love';
UPDATE special_cards SET set_number = '225' WHERE character_name = 'Tars Tarkas' AND name = 'Barsoomian Warrior & Statesman';
UPDATE special_cards SET set_number = '226' WHERE character_name = 'Tars Tarkas' AND name = 'Four-Armed Warrior';
UPDATE special_cards SET set_number = '227' WHERE character_name = 'Tars Tarkas' AND name = 'Jeddak of Thark';
UPDATE special_cards SET set_number = '228' WHERE character_name = 'Tars Tarkas' AND name = 'Protector of the Incubator';
UPDATE special_cards SET set_number = '229' WHERE character_name = 'Tars Tarkas' AND name = 'Sola';

-- Special Cards - Tarzan
UPDATE special_cards SET set_number = '231' WHERE character_name = 'Tarzan' AND name = 'Emotional Senses';
UPDATE special_cards SET set_number = '232' WHERE character_name = 'Tarzan' AND name = 'Jungle Tactics';
UPDATE special_cards SET set_number = '233' WHERE character_name = 'Tarzan' AND name = 'Lord of the Jungle';
UPDATE special_cards SET set_number = '234' WHERE character_name = 'Tarzan' AND name = 'My Feet Feel Like Hands';
UPDATE special_cards SET set_number = '235' WHERE character_name = 'Tarzan' AND name = 'Raised by Mangani Apes';
UPDATE special_cards SET set_number = '236' WHERE character_name = 'Tarzan' AND name = 'Deceptive Maneuver';

-- Special Cards - The Mummy
UPDATE special_cards SET set_number = '238' WHERE character_name = 'The Mummy' AND name = 'Ancient Wisdom';
UPDATE special_cards SET set_number = '239' WHERE character_name = 'The Mummy' AND name = 'Fury of the Desert';
UPDATE special_cards SET set_number = '240' WHERE character_name = 'The Mummy' AND name = 'Pharaoh of the Fourth Dynasty';
UPDATE special_cards SET set_number = '241' WHERE character_name = 'The Mummy' AND name = 'Reinvigorated By Fresh Organs';
UPDATE special_cards SET set_number = '242' WHERE character_name = 'The Mummy' AND name = 'Relentless Pursuit';
UPDATE special_cards SET set_number = '243' WHERE character_name = 'The Mummy' AND name = 'The Eternal Journey';

-- Special Cards - The Three Musketeers
UPDATE special_cards SET set_number = '245' WHERE character_name = 'The Three Musketeers' AND name = 'All For One';
UPDATE special_cards SET set_number = '246' WHERE character_name = 'The Three Musketeers' AND name = 'Aramis';
UPDATE special_cards SET set_number = '247' WHERE character_name = 'The Three Musketeers' AND name = 'Athos';
UPDATE special_cards SET set_number = '248' WHERE character_name = 'The Three Musketeers' AND name = 'D''Artagnan';
UPDATE special_cards SET set_number = '249' WHERE character_name = 'The Three Musketeers' AND name = 'Porthos';
UPDATE special_cards SET set_number = '250' WHERE character_name = 'The Three Musketeers' AND name = 'Valiant Charge';

-- Special Cards - Time Traveler
UPDATE special_cards SET set_number = '252' WHERE character_name = 'Time Traveler' AND name = 'From a Mile Away';
UPDATE special_cards SET set_number = '253' WHERE character_name = 'Time Traveler' AND name = 'Futuristic Phaser';
UPDATE special_cards SET set_number = '254' WHERE character_name = 'Time Traveler' AND name = 'I''ll Already Be Gone';
UPDATE special_cards SET set_number = '255' WHERE character_name = 'Time Traveler' AND name = 'Knowledge of Tomorrow';
UPDATE special_cards SET set_number = '256' WHERE character_name = 'Time Traveler' AND name = 'Harbinger''s Warning';
UPDATE special_cards SET set_number = '257' WHERE character_name = 'Time Traveler' AND name = 'The Tomorrow Doctor';

-- Special Cards - Van Helsing
UPDATE special_cards SET set_number = '259' WHERE character_name = 'Van Helsing' AND name = 'Doctor, Professor, Lawyer, Scientist';
UPDATE special_cards SET set_number = '260' WHERE character_name = 'Van Helsing' AND name = 'Monster Hunting Expert';
UPDATE special_cards SET set_number = '261' WHERE character_name = 'Van Helsing' AND name = 'Crossbow Expert';
UPDATE special_cards SET set_number = '262' WHERE character_name = 'Van Helsing' AND name = 'Right Tools for the Job';
UPDATE special_cards SET set_number = '263' WHERE character_name = 'Van Helsing' AND name = 'Sacred Wafers from Amsterdam';
UPDATE special_cards SET set_number = '264' WHERE character_name = 'Van Helsing' AND name = 'World Renowned Doctor';

-- Special Cards - Victory Harben
UPDATE special_cards SET set_number = '266' WHERE character_name = 'Victory Harben' AND name = 'Abner Perry''s Lab Assistant';
UPDATE special_cards SET set_number = '267' WHERE character_name = 'Victory Harben' AND name = 'Archery, Knives & Jujitsu';
UPDATE special_cards SET set_number = '268' WHERE character_name = 'Victory Harben' AND name = 'Chamston-Hedding Estate';
UPDATE special_cards SET set_number = '269' WHERE character_name = 'Victory Harben' AND name = 'Department of Theoretical Physics';
UPDATE special_cards SET set_number = '270' WHERE character_name = 'Victory Harben' AND name = 'Fires of Halos';
UPDATE special_cards SET set_number = '271' WHERE character_name = 'Victory Harben' AND name = 'Practical Physics';

-- Special Cards - Wicked Witch of the West
UPDATE special_cards SET set_number = '273' WHERE character_name = 'Wicked Witch of the West' AND name = 'Aquaphobic';
UPDATE special_cards SET set_number = '274' WHERE character_name = 'Wicked Witch of the West' AND name = 'Feared by All Witches';
UPDATE special_cards SET set_number = '275' WHERE character_name = 'Wicked Witch of the West' AND name = 'I Will Have Those Silver Shoes!';
UPDATE special_cards SET set_number = '276' WHERE character_name = 'Wicked Witch of the West' AND name = 'One Eye';
UPDATE special_cards SET set_number = '277' WHERE character_name = 'Wicked Witch of the West' AND name = 'Harness the Wind';
UPDATE special_cards SET set_number = '278' WHERE character_name = 'Wicked Witch of the West' AND name = 'Wolves, Crows, & Black Bees';

-- Special Cards - Zeus
UPDATE special_cards SET set_number = '280' WHERE character_name = 'Zeus' AND name = 'A Jealous God';
UPDATE special_cards SET set_number = '281' WHERE character_name = 'Zeus' AND name = 'Banishment';
UPDATE special_cards SET set_number = '282' WHERE character_name = 'Zeus' AND name = 'Hera';
UPDATE special_cards SET set_number = '283' WHERE character_name = 'Zeus' AND name = 'Law and Order';
UPDATE special_cards SET set_number = '284' WHERE character_name = 'Zeus' AND name = 'Thunderbolt';

-- Special Cards - Zorro
UPDATE special_cards SET set_number = '286' WHERE character_name = 'Zorro' AND name = '3 Quick Strokes';
UPDATE special_cards SET set_number = '287' WHERE character_name = 'Zorro' AND name = 'Elite Swordsmanship';
UPDATE special_cards SET set_number = '288' WHERE character_name = 'Zorro' AND name = 'Master of Escape';
UPDATE special_cards SET set_number = '289' WHERE character_name = 'Zorro' AND name = 'Rapier';
UPDATE special_cards SET set_number = '290' WHERE character_name = 'Zorro' AND name = 'Riches of Don Diego de la Vega';
UPDATE special_cards SET set_number = '291' WHERE character_name = 'Zorro' AND name = 'Riposte';

-- Alternate Art Character Cards
-- Match by character name and image_path containing /alternate/
-- For characters with multiple alternates, matching one per set_number (user will sort out remaining matches)
-- Using subquery to limit to one match per UPDATE
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

