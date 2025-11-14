-- Populate set_number column for Any Character special cards
-- Format: 3-digit number only (e.g., 440, 441) - set identifier is ERB
-- Match by character_name = 'Any Character' AND name

-- Any Character: Cataclysm! Cards
UPDATE special_cards SET set_number = '440' 
WHERE character_name = 'Any Character' AND name = 'Lady of the Lake';

UPDATE special_cards SET set_number = '441' 
WHERE character_name = 'Any Character' AND name = 'Robin Hood: Master Thief';

UPDATE special_cards SET set_number = '442' 
WHERE character_name = 'Any Character' AND name = 'Tunupa: Mountain God';

UPDATE special_cards SET set_number = '443' 
WHERE character_name = 'Any Character' AND name = 'Fairy Protection';

UPDATE special_cards SET set_number = '444' 
WHERE character_name = 'Any Character' AND name = 'Loki';

-- Skipping Heimdall (?) - no set_number assigned

-- Any Character: Ambush! Cards
UPDATE special_cards SET set_number = '445' 
WHERE character_name = 'Any Character' AND name = 'Wrath of Ra';

UPDATE special_cards SET set_number = '446' 
WHERE character_name = 'Any Character' AND name = 'Valkyrie Skeggjold';

UPDATE special_cards SET set_number = '447' 
WHERE character_name = 'Any Character' AND name = 'Oni and Succubus';

UPDATE special_cards SET set_number = '448' 
WHERE character_name = 'Any Character' AND name = 'Bodhisattva: Enlightened One';

-- Any Character: Assist! Cards
UPDATE special_cards SET set_number = '449' 
WHERE character_name = 'Any Character' AND name = 'Mystical Energy';

UPDATE special_cards SET set_number = '450' 
WHERE character_name = 'Any Character' AND name = 'Charge into Battle!';

UPDATE special_cards SET set_number = '451' 
WHERE character_name = 'Any Character' AND name = 'Subjugate the Meek';

UPDATE special_cards SET set_number = '452' 
WHERE character_name = 'Any Character' AND name = 'Draconic Leadership';

UPDATE special_cards SET set_number = '453' 
WHERE character_name = 'Any Character' AND name = 'Lilith''s Swarm';

-- Any Character: Regular Special Cards
UPDATE special_cards SET set_number = '454' 
WHERE character_name = 'Any Character' AND name = 'Disorient Opponent';

UPDATE special_cards SET set_number = '455' 
WHERE character_name = 'Any Character' AND name = 'Freya: Goddess of Protection';

UPDATE special_cards SET set_number = '456' 
WHERE character_name = 'Any Character' AND name = 'Grim Reaper';

UPDATE special_cards SET set_number = '457' 
WHERE character_name = 'Any Character' AND name = 'Gunnr: Battle Valkyrie';

UPDATE special_cards SET set_number = '458' 
WHERE character_name = 'Any Character' AND name = 'Hades: Lord of the Underworld';

UPDATE special_cards SET set_number = '459' 
WHERE character_name = 'Any Character' AND name = 'Legendary Escape';

UPDATE special_cards SET set_number = '460' 
WHERE character_name = 'Any Character' AND name = 'Merlin''s Magic';

UPDATE special_cards SET set_number = '461' 
WHERE character_name = 'Any Character' AND name = 'Preternatural Healing';

UPDATE special_cards SET set_number = '462' 
WHERE character_name = 'Any Character' AND name = 'Princess and the Pea';

UPDATE special_cards SET set_number = '463' 
WHERE character_name = 'Any Character' AND name = 'The Gemini';

UPDATE special_cards SET set_number = '464' 
WHERE character_name = 'Any Character' AND name = 'Valkyrie Hildr: Select the Slain';

