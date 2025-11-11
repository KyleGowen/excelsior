-- Fix locations universe column to set all to 'ERB'
-- This ensures consistency for the collection view which displays "Edgar Rice Burroughs and the World Legends"
UPDATE locations 
SET universe = 'ERB',
    updated_at = NOW()
WHERE universe != 'ERB' OR universe IS NULL;

