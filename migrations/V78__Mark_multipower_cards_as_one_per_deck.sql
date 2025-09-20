-- Mark Multi-Power cards as one_per_deck: true
-- According to OverPower rules, Multi-Power cards are special and should be One Per Deck
UPDATE power_cards
SET one_per_deck = true
WHERE power_type = 'Multi Power';
