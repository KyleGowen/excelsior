-- Fix location image paths to match actual filenames

-- Fix Asclepieion image path (asclepieion -> ascleipeion)
UPDATE locations
SET image_path = 'locations/ascleipeion.webp'
WHERE name = 'Asclepieion';

-- Fix Event Horizon image path (event_horizon_the_future -> horizon)
UPDATE locations
SET image_path = 'locations/horizon.webp'
WHERE name = 'Event Horizon: The Future';
