-- Announce optional TopDeck profile links on Home Recent Updates.

INSERT INTO recent_updates (id, title, type, description, card_image_url, created_at, updated_at) VALUES
    (
        'a1000001-0000-4000-8000-000000000014',
        'Link your TopDeck account',
        'feature',
        'Add your TopDeck handle in your profile menu. Your saved handle links to your TopDeck account in your menu and public profile.',
        'sky/specials/110_global_coordination_network.png',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM recent_updates
    WHERE id = 'a1000001-0000-4000-8000-000000000014'
      AND title = 'Link your TopDeck account'
      AND type = 'feature'
      AND description = 'Add your TopDeck handle in your profile menu. Your saved handle links to your TopDeck account in your menu and public profile.'
      AND card_image_url = 'sky/specials/110_global_coordination_network.png'
  ) THEN
    RAISE EXCEPTION 'TopDeck profile feature announcement was not applied';
  END IF;
END $$;
