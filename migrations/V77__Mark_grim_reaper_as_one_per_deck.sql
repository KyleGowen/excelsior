-- Mark Grim Reaper as One Per Deck according to OverPower rules
UPDATE special_cards 
SET one_per_deck = true
WHERE name = 'Grim Reaper';
