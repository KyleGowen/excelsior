-- Update missing character threat levels with correct IDs
UPDATE characters SET threat_level = 16 WHERE id = 'character_angry_mob_(middle_ages)';
UPDATE characters SET threat_level = 18 WHERE id = 'character_angry_mob_(industrial_age)';
UPDATE characters SET threat_level = 20 WHERE id = 'character_angry_mob_(modern_age)';
UPDATE characters SET threat_level = 16 WHERE id = 'character_dr._watson';
UPDATE characters SET threat_level = 16 WHERE id = 'character_mr._hyde';
UPDATE characters SET threat_level = 20 WHERE id = 'character_the_three_musketeers';

-- Remove the placeholder character
DELETE FROM characters WHERE id = 'character_name';
