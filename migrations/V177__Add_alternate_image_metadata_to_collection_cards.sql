-- Add metadata columns to help track alternate art combinations
ALTER TABLE collection_cards
    ADD COLUMN IF NOT EXISTS alternate_image_original VARCHAR(500),
    ADD COLUMN IF NOT EXISTS alternate_image_slug VARCHAR(255);

-- Backfill existing rows so debugging information is available immediately
UPDATE collection_cards
SET alternate_image_original = alternate_image
WHERE alternate_image IS NOT NULL
  AND (alternate_image_original IS NULL OR alternate_image_original = '');

-- Populate slug (filename) for existing rows where possible
UPDATE collection_cards
SET alternate_image_slug = (
    CASE
        WHEN alternate_image IS NULL OR alternate_image = '' THEN NULL
        ELSE regexp_replace(alternate_image, '^.*/', '')
    END
)
WHERE alternate_image_slug IS NULL OR alternate_image_slug = '';

-- Index the slug column to make debugging lookups cheaper
CREATE INDEX IF NOT EXISTS idx_collection_cards_alt_slug
    ON collection_cards(alternate_image_slug)
    WHERE alternate_image_slug IS NOT NULL;

