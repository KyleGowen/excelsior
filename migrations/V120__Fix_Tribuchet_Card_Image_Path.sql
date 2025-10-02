-- Migration to fix Tribuchet card image path
-- The card currently has the wrong image path: basic-universe/6_intelligence_3.webp
-- Should be: basic-universe/7_brute_force_3.webp
-- Card ID: 4542bae8-99a1-415e-b02f-d2e80fbc47e6

DO $$
BEGIN
    -- Update the Tribuchet card image path
    UPDATE basic_universe_cards 
    SET image_path = 'basic-universe/7_brute_force_3.webp'
    WHERE id = '4542bae8-99a1-415e-b02f-d2e80fbc47e6'
    AND name = 'Tribuchet'
    AND type = 'Brute Force'
    AND value_to_use = '7 or greater'
    AND bonus = '+3';
    
    -- Verify the update
    IF FOUND THEN
        RAISE NOTICE 'Tribuchet card image path updated successfully';
    ELSE
        RAISE NOTICE 'Tribuchet card not found or already has correct image path';
    END IF;
END $$;