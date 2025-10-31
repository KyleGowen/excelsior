-- Populate aspects icons/value using V30 names
UPDATE aspects SET icons = ARRAY['Energy'], value = 4, updated_at = NOW() WHERE name = 'Amaru: Dragon Legend';
UPDATE aspects SET icons = ARRAY['Combat'], value = 4, updated_at = NOW() WHERE name = 'Mallku';
UPDATE aspects SET icons = ARRAY['Brute Force'], value = 4, updated_at = NOW() WHERE name = 'Supay';
UPDATE aspects SET icons = ARRAY['Intelligence'], value = 4, updated_at = NOW() WHERE name = 'Cheshire Cat';
UPDATE aspects SET icons = ARRAY['Energy', 'Combat', 'Brute Force', 'Intelligence'], value = 2, updated_at = NOW() WHERE name = 'Isis';
