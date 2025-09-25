-- V98__Remove_duplicate_characters.sql
-- Remove duplicate character entries that don't have descriptions

-- Delete duplicates without descriptions, keeping the ones with descriptions
DELETE FROM characters 
WHERE id IN (
    SELECT c1.id 
    FROM characters c1
    INNER JOIN characters c2 ON c1.name = c2.name
    WHERE c1.description IS NULL 
    AND c2.description IS NOT NULL
    AND c1.id != c2.id
);

-- Verify the cleanup
-- SELECT name, COUNT(*) as count FROM characters GROUP BY name HAVING COUNT(*) > 1;
