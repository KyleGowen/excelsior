-- Update Angry Mob special cards to have variant-specific character names
-- Based on card images showing variant qualifiers (Middle Ages, Industrial Age, Modern Age)
-- Generic "Angry Mob" specials (without variant qualifiers) remain as "Angry Mob"

-- Middle Ages variant specials
UPDATE special_cards
SET character_name = 'Angry Mob: Middle Ages'
WHERE name = 'Pitchforks and Torches'
  AND character_name = 'Angry Mob';

UPDATE special_cards
SET character_name = 'Angry Mob: Middle Ages'
WHERE name = 'Regent of the Crown'
  AND character_name = 'Angry Mob';

-- Industrial Age variant specials
UPDATE special_cards
SET character_name = 'Angry Mob: Industrial Age'
WHERE name = 'Disrupting Supply Lines'
  AND character_name = 'Angry Mob';

UPDATE special_cards
SET character_name = 'Angry Mob: Industrial Age'
WHERE name = 'Union Power'
  AND character_name = 'Angry Mob';

-- Modern Age variant specials
UPDATE special_cards
SET character_name = 'Angry Mob: Modern Age'
WHERE name = 'Online Cyber Attack'
  AND character_name = 'Angry Mob';

UPDATE special_cards
SET character_name = 'Angry Mob: Modern Age'
WHERE name = 'Ransom Your Secrets'
  AND character_name = 'Angry Mob';

-- Generic "Angry Mob" specials (no variant qualifier) remain as "Angry Mob":
-- - "Don't Let it Get Away!"
-- - "Mob Mentality"
-- - "Strength in Numbers"
-- - "Swarm Them!"

-- Verify updates
DO $$
DECLARE
    middle_ages_count INTEGER;
    industrial_age_count INTEGER;
    modern_age_count INTEGER;
    generic_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO middle_ages_count
    FROM special_cards
    WHERE character_name = 'Angry Mob: Middle Ages';
    
    SELECT COUNT(*) INTO industrial_age_count
    FROM special_cards
    WHERE character_name = 'Angry Mob: Industrial Age';
    
    SELECT COUNT(*) INTO modern_age_count
    FROM special_cards
    WHERE character_name = 'Angry Mob: Modern Age';
    
    SELECT COUNT(*) INTO generic_count
    FROM special_cards
    WHERE character_name = 'Angry Mob';
    
    RAISE NOTICE 'Angry Mob special cards updated:';
    RAISE NOTICE '  Middle Ages: %', middle_ages_count;
    RAISE NOTICE '  Industrial Age: %', industrial_age_count;
    RAISE NOTICE '  Modern Age: %', modern_age_count;
    RAISE NOTICE '  Generic (no variant): %', generic_count;
END $$;

