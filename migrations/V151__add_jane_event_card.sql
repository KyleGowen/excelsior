-- Add Jane event card to the events table
INSERT INTO events (
    id,
    name,
    universe,
    mission_set,
    game_effect,
    flavor_text,
    one_per_deck,
    event_description,
    image_path,
    alternate_images,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Jane',
    'ERB',
    'King of the Jungle',
    'No Basic Universe cards may be played this battle.',
    '*I observed the soft words of love that passed between them. Tarzan stepped out from his concealment, parting the foliage and advancing to the edge of the embankment. His feelings for Jane were already clear to me. He stood as if the jungle itself held its breath, waiting for a chance to bridge the impossible gap between them.*',
    true,
    'Jane event card',
    'events/jane.png',
    ARRAY[]::text[],
    NOW(),
    NOW()
);
