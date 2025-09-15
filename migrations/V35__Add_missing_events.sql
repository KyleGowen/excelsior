-- Add missing events that weren't included in the original V34 migration
-- This migration adds the 5 missing events that were added to the markdown file

INSERT INTO events (id, name, universe, mission_set, game_effect, flavor_text, one_per_deck, event_description, image_path, alternate_images) VALUES
-- King of the Jungle missing event
('event_a_captive_no_more', 'A Captive no More', 'ERB', 'King of the Jungle', 'Cards with Brute Force icons don''t count towards Venture Total this battle.', '*He might have been captured, but Tarzan was no helpless animal. With mighty intent and superhuman strength, he broke the steel cage that held him. Turning to leave, he told his cellmate to wait for him, because now he was going to bring the fight to them... and Tarzan was mad!*', true, 'A Captive no More event card', 'events/a_captive_no_more.webp', ARRAY[]::text[]),

-- Chronicles of Mars missing events
('event_the_chamber_of_reptiles', 'The Chamber of Reptiles', 'ERB', 'Chronicles of Mars', 'Each Player may discard one of Opponent''s Special cards in play that have the text "Remainder of Game." If they do, the Opponent gains +3 to Venture Total this battle.', '*I watched as John Carter halted abruptly. Crossing that floor would have meant certain death. But then, I saw his expression shift from caution to determination. If the quarry he pursued had taken this same route, there had to be a way through... and he was going to find it.*', true, 'The Chamber of Reptiles event card', 'events/the_chamber_of_reptiles.webp', ARRAY[]::text[]),
('event_a_venomous_threat', 'A Venomous Threat', 'ERB', 'Chronicles of Mars', 'Move the Reserve character to the Front Line this battle. Return them to the Reserve at the End of Battle Phase.', '*Tan Hadron''s blade gleaming in the dim light and each strike, cleaving through fang and web. These creatures were no match for the Martian I''ve come to admire almost as much as John Carter himself. Victory or death seems to be this mans constant choice and again he chooses victory.*', true, 'A Venomous Threat event card', 'events/a_venomous_threat.webp', ARRAY[]::text[]),

-- Time Wars: Rise of the Gods missing events
('event_getting_our_hands_dirty', 'Getting Our Hands Dirty', 'ERB', 'Time Wars: Rise of the Gods', 'Power cards are +2 to defense when blocking without a Basic Universe card.', '*Joan of Arc''s visions have shown me what even my knowledge of the future could not—an attack to strike at the heart of Olympus itself. With Merlin by her side, the first steps of her plan are set into motion. Now, we march toward Zeus'' throne on Mt. Olympus, where the future of humanity hangs in the balance.*', true, 'Getting Our Hands Dirty event card', 'events/getting_our_hands_dirty.webp', ARRAY[]::text[]),
('event_ready_for_war', 'Ready for War', 'ERB', 'Time Wars: Rise of the Gods', 'No Training Universe cards may be played this battle.', '*Leonidas, the greatest of generals, a man forged for war in the hellfire of battle. And Arthur—king of kings—commands loyalty that runs deeper than blood. We need only delay the Spartan tide long enough to strike at Zeus, and claim victory in the final battle of this Time War.*', true, 'Ready for War event card', 'events/ready_for_war.webp', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  mission_set = EXCLUDED.mission_set,
  game_effect = EXCLUDED.game_effect,
  flavor_text = EXCLUDED.flavor_text,
  one_per_deck = EXCLUDED.one_per_deck,
  event_description = EXCLUDED.event_description,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
