-- Point the Prize Pack announcement at the clean crop from the PP261 source art.
-- Use a new path so browsers with the original screenshot cached fetch the replacement.

UPDATE recent_updates
SET card_image_url = '/src/resources/images/home/skybound-prize-pack-dupli-kate-art.png'
WHERE id = 'a1000001-0000-4000-8000-000000000015';
