-- Migration to set all GUEST role decks to limited status
-- This sets the is_limited flag to true for all decks owned by users with GUEST role

UPDATE decks 
SET is_limited = true, updated_at = NOW()
WHERE user_id IN (
    SELECT id 
    FROM users 
    WHERE role = 'GUEST'
);

-- Verify the update
-- This will show how many GUEST role decks were updated
SELECT 
    COUNT(*) as updated_decks,
    'GUEST role decks set to Limited status' as description
FROM decks 
WHERE user_id IN (
    SELECT id 
    FROM users 
    WHERE role = 'GUEST'
) AND is_limited = true;
