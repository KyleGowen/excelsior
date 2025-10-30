UPDATE characters
SET brute_force = GREATEST(COALESCE(brute_force, 0), 8), updated_at = NOW()
WHERE LOWER(name) IN ('john carter of mars', 'john carter');
