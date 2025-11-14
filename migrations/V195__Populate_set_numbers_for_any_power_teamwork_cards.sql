-- Populate set_number column for Any-Power teamwork cards
-- Format: 3-digit number only (e.g., 480, 481) - set identifier is ERB
-- Match by to_use, first_attack_bonus, second_attack_bonus, and followup_attack_types

UPDATE teamwork_cards SET set_number = '480' 
WHERE to_use = '6 Any-Power' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '0'
  AND followup_attack_types = 'Any-Power / Any-Power';

UPDATE teamwork_cards SET set_number = '481' 
WHERE to_use = '7 Any-Power' 
  AND first_attack_bonus = '0' 
  AND second_attack_bonus = '1'
  AND followup_attack_types = 'Any-Power';

