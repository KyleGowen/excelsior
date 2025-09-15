-- Fix character data column alignment issue
-- The data was shifted left by one column during population

-- First, let's see what we have vs what we should have
-- Current: universe=6, energy=4, combat=6, brute_force=1, intelligence=16, threat_level=16
-- Should be: universe='ERB', energy=6, combat=4, brute_force=6, intelligence=1, threat_level=16

-- Update all characters to fix the column alignment
UPDATE characters SET 
    universe = 'ERB',
    energy = CAST(universe AS INTEGER),
    combat = energy,
    brute_force = combat,
    intelligence = brute_force,
    threat_level = intelligence
WHERE universe ~ '^[0-9]+$'; -- Only update rows where universe is numeric (indicating the shift)

-- Carson of Venus has a special case - his threat level should be 18, not 20
UPDATE characters SET threat_level = 18 WHERE name = 'Carson of Venus';
