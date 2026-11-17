-- Korak ERB #125 prints GIST in the credit line. The workbook left the artist
-- field blank. The catalog uses the same artwork for #125 and #125F.
UPDATE characters
SET artist = 'GIST'
WHERE set = 'ERB'
  AND set_number IN ('125', '125F')
  AND image_path = 'erb/characters/125_korak.png'
  AND artist IS NULL;
