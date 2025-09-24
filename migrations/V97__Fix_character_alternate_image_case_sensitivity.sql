-- Fix case sensitivity issues in character alternate images
-- This migration corrects the filenames to match the actual files in the filesystem

-- Fix Leonidas alternate image (Leonidas.webp -> leonidas.webp)
UPDATE characters 
SET alternate_images = '{characters/alternate/leonidas.webp}' 
WHERE name = 'Leonidas' AND alternate_images = '{characters/alternate/Leonidas.webp}';

-- Fix Merlin alternate image (Merlin.png -> merlin.png)
UPDATE characters 
SET alternate_images = '{characters/alternate/merlin.png}' 
WHERE name = 'Merlin' AND alternate_images = '{characters/alternate/Merlin.png}';

-- Fix Zeus alternate image (Zeus.webp -> zeus.webp)
UPDATE characters 
SET alternate_images = '{characters/alternate/zeus.webp}' 
WHERE name = 'Zeus' AND alternate_images = '{characters/alternate/Zeus.webp}';

-- Fix Dr. Watson alternate image (remove extra quotes)
UPDATE characters 
SET alternate_images = '{characters/alternate/dr. watson.png}' 
WHERE name = 'Dr. Watson' AND alternate_images = '{"characters/alternate/dr. watson.png"}';

-- Verify the fixes
-- These should all return 0 rows if the fixes were applied correctly
SELECT 'Leonidas case fix' as check_name, count(*) as remaining_issues
FROM characters 
WHERE name = 'Leonidas' AND alternate_images = '{characters/alternate/Leonidas.webp}'

UNION ALL

SELECT 'Merlin case fix' as check_name, count(*) as remaining_issues
FROM characters 
WHERE name = 'Merlin' AND alternate_images = '{characters/alternate/Merlin.png}'

UNION ALL

SELECT 'Zeus case fix' as check_name, count(*) as remaining_issues
FROM characters 
WHERE name = 'Zeus' AND alternate_images = '{characters/alternate/Zeus.webp}'

UNION ALL

SELECT 'Dr. Watson quotes fix' as check_name, count(*) as remaining_issues
FROM characters 
WHERE name = 'Dr. Watson' AND alternate_images = '{"characters/alternate/dr. watson.png"}';
