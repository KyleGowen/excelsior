-- Add threat_level column to characters table
ALTER TABLE characters 
ADD COLUMN threat_level INTEGER;

-- Create index on threat_level for filtering
CREATE INDEX idx_characters_threat_level ON characters(threat_level);

-- Update existing characters with their threat levels
UPDATE characters SET threat_level = 16 WHERE id = 'character_angry_mob_middle_ages';
UPDATE characters SET threat_level = 18 WHERE id = 'character_angry_mob_industrial_age';
UPDATE characters SET threat_level = 20 WHERE id = 'character_angry_mob_modern_age';
UPDATE characters SET threat_level = 18 WHERE id = 'character_anubis';
UPDATE characters SET threat_level = 17 WHERE id = 'character_billy_the_kid';
UPDATE characters SET threat_level = 20 WHERE id = 'character_captain_nemo';
UPDATE characters SET threat_level = 18 WHERE id = 'character_carson_of_venus';
UPDATE characters SET threat_level = 20 WHERE id = 'character_count_of_monte_cristo';
UPDATE characters SET threat_level = 22 WHERE id = 'character_cthulhu';
UPDATE characters SET threat_level = 18 WHERE id = 'character_dejah_thoris';
UPDATE characters SET threat_level = 16 WHERE id = 'character_dr_watson';
UPDATE characters SET threat_level = 22 WHERE id = 'character_dracula';
UPDATE characters SET threat_level = 18 WHERE id = 'character_headless_horseman';
UPDATE characters SET threat_level = 22 WHERE id = 'character_hercules';
UPDATE characters SET threat_level = 17 WHERE id = 'character_invisible_man';
UPDATE characters SET threat_level = 16 WHERE id = 'character_jane_porter';
UPDATE characters SET threat_level = 18 WHERE id = 'character_joan_of_arc';
UPDATE characters SET threat_level = 19 WHERE id = 'character_john_carter_of_mars';
UPDATE characters SET threat_level = 20 WHERE id = 'character_king_arthur';
UPDATE characters SET threat_level = 17 WHERE id = 'character_korak';
UPDATE characters SET threat_level = 18 WHERE id = 'character_lancelot';
UPDATE characters SET threat_level = 21 WHERE id = 'character_leonidas';
UPDATE characters SET threat_level = 21 WHERE id = 'character_merlin';
UPDATE characters SET threat_level = 18 WHERE id = 'character_mina_harker';
UPDATE characters SET threat_level = 19 WHERE id = 'character_morgan_le_fay';
UPDATE characters SET threat_level = 16 WHERE id = 'character_mr_hyde';
UPDATE characters SET threat_level = 19 WHERE id = 'character_poseidon';
UPDATE characters SET threat_level = 20 WHERE id = 'character_professor_moriarty';
UPDATE characters SET threat_level = 20 WHERE id = 'character_ra';
UPDATE characters SET threat_level = 18 WHERE id = 'character_robin_hood';
UPDATE characters SET threat_level = 18 WHERE id = 'character_sheriff_of_nottingham';
UPDATE characters SET threat_level = 19 WHERE id = 'character_sherlock_holmes';
UPDATE characters SET threat_level = 22 WHERE id = 'character_sun_wukong';
UPDATE characters SET threat_level = 20 WHERE id = 'character_tars_tarkas';
UPDATE characters SET threat_level = 19 WHERE id = 'character_tarzan';
UPDATE characters SET threat_level = 18 WHERE id = 'character_the_mummy';
UPDATE characters SET threat_level = 20 WHERE id = 'character_three_musketeers';
UPDATE characters SET threat_level = 18 WHERE id = 'character_time_traveler';
UPDATE characters SET threat_level = 20 WHERE id = 'character_van_helsing';
UPDATE characters SET threat_level = 18 WHERE id = 'character_victory_harben';
UPDATE characters SET threat_level = 19 WHERE id = 'character_wicked_witch';
UPDATE characters SET threat_level = 23 WHERE id = 'character_zeus';
UPDATE characters SET threat_level = 20 WHERE id = 'character_zorro';
