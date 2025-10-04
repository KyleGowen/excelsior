-- V124: Update "Chronicles of Mars" to "The Warlord of Mars" in events table
-- This migration fixes the event name to match the mission table and actual card image

UPDATE events
SET mission_set = 'The Warlord of Mars'
WHERE mission_set = 'Chronicles of Mars';

-- Verify the update
-- All "Chronicles of Mars" events should now be "The Warlord of Mars"
SELECT mission_set, COUNT(*) as count
FROM events
WHERE mission_set IN ('Chronicles of Mars', 'The Warlord of Mars')
GROUP BY mission_set
ORDER BY mission_set;
