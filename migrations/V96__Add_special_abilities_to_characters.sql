-- Add special_abilities column to characters table
ALTER TABLE characters 
ADD COLUMN special_abilities TEXT;

-- Create index on special_abilities for filtering
CREATE INDEX idx_characters_special_abilities ON characters(special_abilities);

-- Update special abilities for each character based on the markdown file data
UPDATE characters SET special_abilities = 'Must have 25 hits to be Cumulative KO''d.' WHERE name = 'Angry Mob (Middle Ages)';
UPDATE characters SET special_abilities = 'Must have 25 hits to be Cumulative KO''d.' WHERE name = 'Angry Mob (Industrial Age)';
UPDATE characters SET special_abilities = 'Must have 30 hits to be Cumulative KO''d.' WHERE name = 'Angry Mob (Modern Age)';
UPDATE characters SET special_abilities = '' WHERE name = 'Anubis';
UPDATE characters SET special_abilities = 'May play numerical Special cards from Reserve.' WHERE name = 'Billy the Kid';
UPDATE characters SET special_abilities = '' WHERE name = 'Captain Nemo';
UPDATE characters SET special_abilities = 'Threat Level is 19 if he starts the game in Reserve.' WHERE name = 'Carson of Venus';
UPDATE characters SET special_abilities = '' WHERE name = 'Count of Monte Cristo';
UPDATE characters SET special_abilities = 'May play Intelligence Teamwork cards from Reserve.' WHERE name = 'Cthulhu';
UPDATE characters SET special_abilities = '' WHERE name = 'Dejah Thoris';
UPDATE characters SET special_abilities = 'Watson is +2 to Venture Total if using 221-B Baker St. as Homebase.' WHERE name = 'Dr. Watson';
UPDATE characters SET special_abilities = 'After Discard Phase, may offer +2 to all actions this battle; if accepted, may remove 2 hits.' WHERE name = 'Dracula';
UPDATE characters SET special_abilities = '' WHERE name = 'Headless Horseman';
UPDATE characters SET special_abilities = '' WHERE name = 'Hercules';
UPDATE characters SET special_abilities = '' WHERE name = 'Invisible Man';
UPDATE characters SET special_abilities = '' WHERE name = 'Jane Porter';
UPDATE characters SET special_abilities = '' WHERE name = 'Joan of Arc';
UPDATE characters SET special_abilities = 'May always include level 7 Brute Force Power cards in his deck.' WHERE name = 'John Carter of Mars';
UPDATE characters SET special_abilities = 'Team is +1 to Venture Total each battle.' WHERE name = 'King Arthur';
UPDATE characters SET special_abilities = '' WHERE name = 'Korak';
UPDATE characters SET special_abilities = 'Start the game with "Sword and Shield" placed; does not take up placing slot.' WHERE name = 'Lancelot';
UPDATE characters SET special_abilities = '' WHERE name = 'Leonidas';
UPDATE characters SET special_abilities = 'After Venture Phase may look at top card of Draw Pile & optionally bottom it.' WHERE name = 'Merlin';
UPDATE characters SET special_abilities = '' WHERE name = 'Mina Harker';
UPDATE characters SET special_abilities = 'Counts as 20 points for deck-skulling if she starts in Reserve.' WHERE name = 'Morgan le Fay';
UPDATE characters SET special_abilities = '' WHERE name = 'Mr. Hyde';
UPDATE characters SET special_abilities = '' WHERE name = 'Poseidon';
UPDATE characters SET special_abilities = '' WHERE name = 'Professor Moriarty';
UPDATE characters SET special_abilities = 'May discard 3 Staff cards from play to reduce KO threshold of 1 Opponent''s character by 1 for remainder of game.' WHERE name = 'Ra';
UPDATE characters SET special_abilities = '' WHERE name = 'Robin Hood';
UPDATE characters SET special_abilities = 'May make 7 both follow-up attacks to Teamwork Universe cards he plays.' WHERE name = 'Sheriff of Nottingham';
UPDATE characters SET special_abilities = '' WHERE name = 'Sherlock Holmes';
UPDATE characters SET special_abilities = '' WHERE name = 'Sun Wukong';
UPDATE characters SET special_abilities = 'May have 1 placed Basic Universe card that does not take up a placing slot.' WHERE name = 'Tars Tarkas';
UPDATE characters SET special_abilities = 'May avoid Brute Force attacks with Intelligence Power cards playable by Tarzan.' WHERE name = 'Tarzan';
UPDATE characters SET special_abilities = 'Must have a hit with an Energy icon to be KO''d.' WHERE name = 'The Mummy';
UPDATE characters SET special_abilities = 'May not use Spectrum or Cumulative KO''d with Teamwork cards.' WHERE name = 'The Three Musketeers';
UPDATE characters SET special_abilities = 'May play level 7 and 8 Intelligence Power cards defensively.' WHERE name = 'Time Traveler';
UPDATE characters SET special_abilities = 'Van Helsing is +4 to attacks made against Dracula.' WHERE name = 'Van Helsing';
UPDATE characters SET special_abilities = 'Threat level is 20 if she starts the game in Reserve.' WHERE name = 'Victory Harben';
UPDATE characters SET special_abilities = '' WHERE name = 'Wicked Witch';
UPDATE characters SET special_abilities = 'May have 1 duplicate "Thunderbolt" Special; may not play Energy Teamwork cards.' WHERE name = 'Zeus';
UPDATE characters SET special_abilities = '' WHERE name = 'Zorro';
ALTER TABLE characters 
ADD COLUMN special_abilities TEXT;

-- Create index on special_abilities for filtering
CREATE INDEX idx_characters_special_abilities ON characters(special_abilities);

-- Update special abilities for each character based on the markdown file data
UPDATE characters SET special_abilities = 'Must have 25 hits to be Cumulative KO''d.' WHERE name = 'Angry Mob (Middle Ages)';
UPDATE characters SET special_abilities = 'Must have 25 hits to be Cumulative KO''d.' WHERE name = 'Angry Mob (Industrial Age)';
UPDATE characters SET special_abilities = 'Must have 30 hits to be Cumulative KO''d.' WHERE name = 'Angry Mob (Modern Age)';
UPDATE characters SET special_abilities = '' WHERE name = 'Anubis';
UPDATE characters SET special_abilities = 'May play numerical Special cards from Reserve.' WHERE name = 'Billy the Kid';
UPDATE characters SET special_abilities = '' WHERE name = 'Captain Nemo';
UPDATE characters SET special_abilities = 'Threat Level is 19 if he starts the game in Reserve.' WHERE name = 'Carson of Venus';
UPDATE characters SET special_abilities = '' WHERE name = 'Count of Monte Cristo';
UPDATE characters SET special_abilities = 'May play Intelligence Teamwork cards from Reserve.' WHERE name = 'Cthulhu';
UPDATE characters SET special_abilities = '' WHERE name = 'Dejah Thoris';
UPDATE characters SET special_abilities = 'Watson is +2 to Venture Total if using 221-B Baker St. as Homebase.' WHERE name = 'Dr. Watson';
UPDATE characters SET special_abilities = 'After Discard Phase, may offer +2 to all actions this battle; if accepted, may remove 2 hits.' WHERE name = 'Dracula';
UPDATE characters SET special_abilities = '' WHERE name = 'Headless Horseman';
UPDATE characters SET special_abilities = '' WHERE name = 'Hercules';
UPDATE characters SET special_abilities = '' WHERE name = 'Invisible Man';
UPDATE characters SET special_abilities = '' WHERE name = 'Jane Porter';
UPDATE characters SET special_abilities = '' WHERE name = 'Joan of Arc';
UPDATE characters SET special_abilities = 'May always include level 7 Brute Force Power cards in his deck.' WHERE name = 'John Carter of Mars';
UPDATE characters SET special_abilities = 'Team is +1 to Venture Total each battle.' WHERE name = 'King Arthur';
UPDATE characters SET special_abilities = '' WHERE name = 'Korak';
UPDATE characters SET special_abilities = 'Start the game with "Sword and Shield" placed; does not take up placing slot.' WHERE name = 'Lancelot';
UPDATE characters SET special_abilities = '' WHERE name = 'Leonidas';
UPDATE characters SET special_abilities = 'After Venture Phase may look at top card of Draw Pile & optionally bottom it.' WHERE name = 'Merlin';
UPDATE characters SET special_abilities = '' WHERE name = 'Mina Harker';
UPDATE characters SET special_abilities = 'Counts as 20 points for deck-skulling if she starts in Reserve.' WHERE name = 'Morgan le Fay';
UPDATE characters SET special_abilities = '' WHERE name = 'Mr. Hyde';
UPDATE characters SET special_abilities = '' WHERE name = 'Poseidon';
UPDATE characters SET special_abilities = '' WHERE name = 'Professor Moriarty';
UPDATE characters SET special_abilities = 'May discard 3 Staff cards from play to reduce KO threshold of 1 Opponent''s character by 1 for remainder of game.' WHERE name = 'Ra';
UPDATE characters SET special_abilities = '' WHERE name = 'Robin Hood';
UPDATE characters SET special_abilities = 'May make 7 both follow-up attacks to Teamwork Universe cards he plays.' WHERE name = 'Sheriff of Nottingham';
UPDATE characters SET special_abilities = '' WHERE name = 'Sherlock Holmes';
UPDATE characters SET special_abilities = '' WHERE name = 'Sun Wukong';
UPDATE characters SET special_abilities = 'May have 1 placed Basic Universe card that does not take up a placing slot.' WHERE name = 'Tars Tarkas';
UPDATE characters SET special_abilities = 'May avoid Brute Force attacks with Intelligence Power cards playable by Tarzan.' WHERE name = 'Tarzan';
UPDATE characters SET special_abilities = 'Must have a hit with an Energy icon to be KO''d.' WHERE name = 'The Mummy';
UPDATE characters SET special_abilities = 'May not use Spectrum or Cumulative KO''d with Teamwork cards.' WHERE name = 'The Three Musketeers';
UPDATE characters SET special_abilities = 'May play level 7 and 8 Intelligence Power cards defensively.' WHERE name = 'Time Traveler';
UPDATE characters SET special_abilities = 'Van Helsing is +4 to attacks made against Dracula.' WHERE name = 'Van Helsing';
UPDATE characters SET special_abilities = 'Threat level is 20 if she starts the game in Reserve.' WHERE name = 'Victory Harben';
UPDATE characters SET special_abilities = '' WHERE name = 'Wicked Witch';
UPDATE characters SET special_abilities = 'May have 1 duplicate "Thunderbolt" Special; may not play Energy Teamwork cards.' WHERE name = 'Zeus';
UPDATE characters SET special_abilities = '' WHERE name = 'Zorro';
