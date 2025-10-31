-- Fix special card effect texts
-- This migration corrects incorrect card effect text for multiple special cards

-- Fix Dracula's "To the Last Man" - change "remainder" to "teammate"
UPDATE special_cards
SET card_effect = 'Opponent''s team may not attack or defend with cards with the word "teammate" for remainder of battle.',
    updated_at = NOW()
WHERE name = 'To the Last Man' AND character_name = 'Dracula';

-- Fix Headless Horseman's "Decapitate" - remove "May not be defended by a Special card." part
UPDATE special_cards
SET card_effect = 'Target character must discard 1 placed card of Headless Horseman''s choice. If target has "Mark of the Headless" as a hit, target must discard all placed cards.',
    updated_at = NOW()
WHERE name = 'Decapitate' AND character_name = 'Headless Horseman';

-- Fix Invisible Man's "Run and Hide" - change level 5 to level 8
UPDATE special_cards
SET card_effect = 'Invisible Man may use any Intelligence Power card level 1-8 to avoid any attack made against him for remainder of game. **One Per Deck**',
    updated_at = NOW()
WHERE name = 'Run and Hide' AND character_name = 'Invisible Man';

-- Fix Korak's "Meriem and Jackie Clayton" - update effect text
UPDATE special_cards
SET card_effect = 'For remainder of game, all attacks on Korak''s team are shifted to Korak and are -2 to attack, until Korak is KO''d.',
    updated_at = NOW()
WHERE name = 'Meriem and Jackie Clayton' AND character_name = 'Korak';

