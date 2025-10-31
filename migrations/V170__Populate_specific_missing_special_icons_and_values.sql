-- Populate specific missing icons/value for specials identified by query
-- Only updates rows where icons or value are currently NULL

-- Count of Monte Cristo – Network of Thieves: Influence == Intelligence, level 6
UPDATE special_cards
SET icons = ARRAY['Intelligence'], value = 6, updated_at = NOW()
WHERE name = 'Network of Thieves' AND character_name = 'Count of Monte Cristo'
  AND (icons IS NULL OR value IS NULL);

-- Angry Mob – Don't Let it Get Away!: MultiPower level 2 (all four)
UPDATE special_cards
SET icons = ARRAY['Energy','Combat','Brute Force','Intelligence'], value = 2, updated_at = NOW()
WHERE name = 'Don''t Let it Get Away!' AND character_name = 'Angry Mob'
  AND (icons IS NULL OR value IS NULL);

-- John Carter of Mars – Leap into the Fray: Energy/Combat/Brute Force MultiPower level 8
UPDATE special_cards
SET icons = ARRAY['Energy','Combat','Brute Force'], value = 8, updated_at = NOW()
WHERE name = 'Leap into the Fray' AND character_name = 'John Carter of Mars'
  AND (icons IS NULL OR value IS NULL);

-- Robin Hood – Band of Merry Men: Brute Force level 5
UPDATE special_cards
SET icons = ARRAY['Brute Force'], value = 5, updated_at = NOW()
WHERE name = 'Band of Merry Men' AND character_name = 'Robin Hood'
  AND (icons IS NULL OR value IS NULL);

-- Tars Tarkas – Barsoomian Warrior & Statesman: Any-Power level 6
UPDATE special_cards
SET icons = ARRAY['Any-Power'], value = 6, updated_at = NOW()
WHERE name = 'Barsoomian Warrior & Statesman' AND character_name = 'Tars Tarkas'
  AND (icons IS NULL OR value IS NULL);

-- Morgan le Fay – Enchantress' Guile: Energy level 4
UPDATE special_cards
SET icons = ARRAY['Energy'], value = 4, updated_at = NOW()
WHERE name = 'Enchantress'' Guile' AND character_name = 'Morgan le Fay'
  AND (icons IS NULL OR value IS NULL);

-- Morgan le Fay – Shapeshifter's Guise: Combat level 3
UPDATE special_cards
SET icons = ARRAY['Combat'], value = 3, updated_at = NOW()
WHERE name = 'Shapeshifter''s Guise' AND character_name = 'Morgan le Fay'
  AND (icons IS NULL OR value IS NULL);

-- Poseidon – Poseidon's Might: Any-Power level 7
UPDATE special_cards
SET icons = ARRAY['Any-Power'], value = 7, updated_at = NOW()
WHERE name = 'Poseidon''s Might' AND character_name = 'Poseidon'
  AND (icons IS NULL OR value IS NULL);

-- The Three Musketeers – D'Artagnan: MultiPower level 8 (all four)
UPDATE special_cards
SET icons = ARRAY['Energy','Combat','Brute Force','Intelligence'], value = 8, updated_at = NOW()
WHERE name = 'D''Artagnan' AND character_name = 'The Three Musketeers'
  AND (icons IS NULL OR value IS NULL);

-- Victory Harben – Archery, Knives & Jiu-jitsu: MultiPower level 3 (all four)
UPDATE special_cards
SET icons = ARRAY['Energy','Combat','Brute Force','Intelligence'], value = 3, updated_at = NOW()
WHERE name = 'Archery, Knives & Jiu-jitsu' AND character_name = 'Victory Harben'
  AND (icons IS NULL OR value IS NULL);

-- Wicked Witch – Wolves, Crows, & Black Bees: MultiPower level 8 (all four)
UPDATE special_cards
SET icons = ARRAY['Energy','Combat','Brute Force','Intelligence'], value = 8, updated_at = NOW()
WHERE name = 'Wolves, Crows, & Black Bees' AND character_name = 'Wicked Witch'
  AND (icons IS NULL OR value IS NULL);

-- Carson of Venus – Sometimes Piracy is the Best Option: dual values (7 Brute Force attack OR 5 Intelligence defense)
-- Schema only supports a single value; choose primary attack value 7 and include both icons
UPDATE special_cards
SET icons = ARRAY['Brute Force','Intelligence'], value = 7, updated_at = NOW()
WHERE name = 'Sometimes Piracy is the Best Option' AND character_name = 'Carson of Venus'
  AND (icons IS NULL OR value IS NULL);

-- Mina Harker – Jonathan Harker, Solicitor: Intelligence level 5
UPDATE special_cards
SET icons = ARRAY['Intelligence'], value = 5, updated_at = NOW()
WHERE name = 'Jonathan Harker, Solicitor' AND character_name = 'Mina Harker'
  AND (icons IS NULL OR value IS NULL);

-- Zorro – Riposte: Brute Force or Intelligence MultiPower level 5
UPDATE special_cards
SET icons = ARRAY['Brute Force','Intelligence'], value = 5, updated_at = NOW()
WHERE name = 'Riposte' AND character_name = 'Zorro'
  AND (icons IS NULL OR value IS NULL);

-- Invisible Man – I've Murdered Before: Brute Force level 0
UPDATE special_cards
SET icons = ARRAY['Brute Force'], value = 0, updated_at = NOW()
WHERE name = 'I''ve Murdered Before' AND character_name = 'Invisible Man'
  AND (icons IS NULL OR value IS NULL);


