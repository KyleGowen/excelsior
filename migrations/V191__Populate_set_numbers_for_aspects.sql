-- Populate set_number column for aspect cards
-- Format: 3-digit number only (e.g., 434, 435) - set identifier is ERB
-- Match by value and icons array

-- Aspect Cards - 4 Energy, make an additional attack
UPDATE aspects SET set_number = '434' 
WHERE value = 4 AND icons @> ARRAY['Energy']::text[];

-- Aspect Cards - 4 Combat, make an additional attack
UPDATE aspects SET set_number = '435' 
WHERE value = 4 AND icons @> ARRAY['Combat']::text[];

-- Aspect Cards - 4 Brute Force, make an additional attack
UPDATE aspects SET set_number = '436' 
WHERE value = 4 AND icons @> ARRAY['Brute Force']::text[];

-- Aspect Cards - 4 Intelligence, make an additional attack
UPDATE aspects SET set_number = '437' 
WHERE value = 4 AND icons @> ARRAY['Intelligence']::text[];

-- Aspect Cards - 2 MultiPower, Make 1 Additional attack
-- MultiPower has all four icons: Energy, Combat, Brute Force, Intelligence
UPDATE aspects SET set_number = '438' 
WHERE value = 2 
  AND icons @> ARRAY['Energy']::text[]
  AND icons @> ARRAY['Combat']::text[]
  AND icons @> ARRAY['Brute Force']::text[]
  AND icons @> ARRAY['Intelligence']::text[];

