-- Seed the four official Skybound preconstructed decks from
-- Skybound Starter Decks.xlsx. Card rows resolve by set code + collector number +
-- non-foil status so environment-specific card UUIDs are never embedded.
-- The workbook's row order is retained as deck_cards.display_order.

-- Production and normal local environments already have this account. Fresh CI
-- databases need a deterministic owner too; the sentinel hash cannot authenticate
-- and an existing account (including its real credentials) is never modified.
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
VALUES (
    'a3520000-0000-4000-8000-000000000001'::uuid,
    'precon_decks',
    'precon-decks+a352@invalid.example',
    '$2b$10$9J6IIXqgEVInZCrqlangqe5.2tTEbvpLQNAnW7lGN5PIMEiUxhHPW',
    'USER',
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

CREATE TABLE preconstructed_decks (
    deck_id UUID PRIMARY KEY REFERENCES decks(id) ON DELETE CASCADE,
    set_code VARCHAR(10) NOT NULL REFERENCES sets(code) ON UPDATE CASCADE,
    set_label VARCHAR(80) NOT NULL,
    release_order INTEGER NOT NULL,
    deck_order INTEGER NOT NULL,
    CONSTRAINT preconstructed_decks_set_order_unique UNIQUE (set_code, deck_order),
    CONSTRAINT preconstructed_decks_set_label_not_blank CHECK (btrim(set_label) <> ''),
    CONSTRAINT preconstructed_decks_release_order_positive CHECK (release_order > 0),
    CONSTRAINT preconstructed_decks_deck_order_positive CHECK (deck_order > 0)
);

CREATE INDEX idx_preconstructed_decks_release_order
    ON preconstructed_decks (release_order DESC, deck_order ASC);

COMMENT ON TABLE preconstructed_decks IS
    'Official preconstructed deck registry; deck contents remain sourced from decks/deck_cards.';

CREATE TEMP TABLE tmp_preconstructed_source_sky (
    deck_id UUID NOT NULL,
    card_order INTEGER NOT NULL,
    set_number VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    source_label TEXT NOT NULL,
    PRIMARY KEY (deck_id, card_order)
) ON COMMIT DROP;

INSERT INTO tmp_preconstructed_source_sky (
    deck_id, card_order, set_number, quantity, source_label
) VALUES
    ('a3520001-0000-4000-8000-000000000001'::uuid, 1, '001', 1, 'Invincible - Character Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 2, '003', 1, 'Invincible - I am Invincible'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 3, '004', 1, 'Invincible - Brutal Fighter'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 4, '005', 1, 'Invincible - Combat Training'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 5, '006', 1, 'Invincible - Sucker Punch'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 6, '008', 1, 'Omni-Man - Character Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 7, '009', 1, 'Omni-Man - I''m Here To Help'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 8, '010', 1, 'Omni-Man - Brutal Efficiency'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 9, '012', 1, 'Omni-Man - Viltrumite Physiology'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 10, '014', 1, 'Omni-Man - Earth''s Greatest Hero'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 11, '015', 1, 'Rex Splode - Character Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 12, '017', 1, 'Rex Splode - I need this'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 13, '043', 1, 'Alan The Alien - Character Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 14, '044', 1, 'Alan The Alien - Evaluation Officer'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 15, '046', 1, 'Alan The Alien - Savior Of His People'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 16, '047', 1, 'Alan The Alien - Bred For Battle'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 17, '049', 1, 'Alan The Alien - Friendly Manipulation'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 18, '277', 3, '8 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 19, '276', 3, '7 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 20, '275', 3, '6 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 21, '274', 3, '5 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 22, '257', 1, '4 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 23, '265', 2, '4 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 24, '256', 1, '3 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 25, '264', 2, '3 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 26, '255', 1, '2 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 27, '279', 2, '2 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 28, '254', 1, '1 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 29, '278', 2, '1 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 30, '300', 1, '6 Brute Force +2 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 31, '301', 1, '6 Brute Force +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 32, '302', 1, '7 Brute Force +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 33, '308', 1, '5 Energy, 5 Intelligence +4 - Universe: Training Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 34, '395', 1, 'Invincible Mission Set #1 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 35, '396', 1, 'Invincible Mission Set #2 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 36, '397', 1, 'Invincible Mission Set #3 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 37, '398', 1, 'Invincible Mission Set #4 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 38, '399', 1, 'Invincible Mission Set #5 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 39, '400', 1, 'Invincible Mission Set #6 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 40, '401', 1, 'Invincible Mission Set #7 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 41, '402', 1, 'Invicible Event #1 - Event Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 42, '403', 1, 'Invicible Event #2 - Event Card'),
    ('a3520001-0000-4000-8000-000000000001'::uuid, 43, '404', 1, 'Invicible Event #3 - Event Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 1, '128', 1, 'Rick - Character Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 2, '129', 1, 'Rick - Morgan Jones'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 3, '130', 1, 'Rick - Riot Gear'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 4, '131', 1, 'Rick - Colt .45'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 5, '132', 1, 'Rick - Learn from our Enemies'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 6, '142', 1, 'Michonne - Character Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 7, '143', 1, 'Michonne - Walker Camouflage'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 8, '145', 1, 'Michonne - Katana'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 9, '146', 1, 'Michonne - Post-Apocalyptic Lawyer'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 10, '147', 1, 'Michonne - Survival Skills'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 11, '149', 1, 'Negan - Character Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 12, '152', 1, 'Negan - You Just Thanked Me For It'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 13, '153', 1, 'Negan - Half Your Stuff'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 14, '154', 1, 'Negan - Lucille'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 15, '155', 1, 'Negan - Sadistic Charm'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 16, '198', 1, 'Alexandria - Character Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 17, '204', 1, 'Alexandria - A Fathers Legacy'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 18, '254', 3, '1 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 19, '271', 3, '2 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 20, '280', 3, '3 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 21, '281', 3, '4 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 22, '266', 3, '5 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 23, '267', 3, '6 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 24, '268', 3, '7 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 25, '269', 3, '8 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 26, '297', 1, '6 Combat +2 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 27, '298', 1, '6 Combat +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 28, '299', 1, '7 Combat +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 29, '307', 1, '5 Energy, 5 Brute Force +4 - Universe: Training Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 30, '407', 1, 'Walking Dead Mission Set # 1 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 31, '408', 1, 'Walking Dead Mission Set # 2 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 32, '409', 1, 'Walking Dead Mission Set # 3 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 33, '410', 1, 'Walking Dead Mission Set # 4 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 34, '411', 1, 'Walking Dead Mission Set # 5 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 35, '412', 1, 'Walking Dead Mission Set # 6 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 36, '413', 1, 'Walking Dead Mission Set # 7 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 37, '414', 1, 'Walking Dead Event Card # 1 - Event Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 38, '415', 1, 'Walking Dead Event Card # 2 - Event Card'),
    ('a3520001-0000-4000-8000-000000000002'::uuid, 39, '416', 1, 'Walking Dead Event Card # 3 - Event Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 1, '022', 1, 'Robot - Character Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 2, '023', 1, 'Robot - Contingency Protocol'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 3, '025', 1, 'Robot - Analyze Threat'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 4, '027', 1, 'Robot - Replacement body'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 5, '028', 1, 'Robot - Limitless Permutations'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 6, '093', 1, 'Doc Seismic - Character Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 7, '095', 1, 'Doc Seismic - Destroying you Monuments'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 8, '096', 1, 'Doc Seismic - Improved Jetpack'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 9, '098', 1, 'Doc Seismic - Seismic Gauntlets'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 10, '099', 1, 'Doc Seismic - Magmanites'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 11, '036', 1, 'Dupli-Kate - Character Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 12, '038', 1, 'Dupli-Kate - One Woman Army'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 13, '039', 1, 'Dupli-Kate - Dupli-Copy'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 14, '040', 1, 'Dupli-Kate - Multi-tastking'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 15, '058', 1, 'Mauler Twins - Character Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 16, '059', 1, 'Mauler Twins - My Brother'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 17, '062', 1, 'Mauler Twins - Tactical Alliance'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 18, '270', 3, '1 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 19, '255', 3, '2 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 20, '256', 3, '3 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 21, '257', 3, '4 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 22, '282', 3, '5 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 23, '283', 3, '6 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 24, '284', 3, '7 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 25, '285', 3, '8 Intelligence - Power Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 26, '303', 1, '6 Intelligence +2 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 27, '304', 1, '6 Intelligence +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 28, '305', 1, '7 Intelligence +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 29, '309', 1, '5 Combat, 5 Brute Force +4 - Universe: Training Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 30, '395', 1, 'Invincible Mission Set #1 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 31, '396', 1, 'Invincible Mission Set #2 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 32, '397', 1, 'Invincible Mission Set #3 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 33, '398', 1, 'Invincible Mission Set #4 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 34, '399', 1, 'Invincible Mission Set #5 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 35, '400', 1, 'Invincible Mission Set #6 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 36, '401', 1, 'Invincible Mission Set #7 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 37, '402', 1, 'Invicible Event #1 - Event Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 38, '403', 1, 'Invicible Event #2 - Event Card'),
    ('a3520001-0000-4000-8000-000000000003'::uuid, 39, '404', 1, 'Invicible Event #3 - Event Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 1, '240', 1, 'God King Lore - Hero Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 2, '241', 1, 'God King Lore - The Chosen One'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 3, '242', 1, 'God King Lore - Sword of Terrenos'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 4, '244', 1, 'God King Lore - Limitless Armies'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 5, '246', 1, 'God King Lore - Chosen by Magic'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 6, '247', 1, 'Spencer Dales - (Excellence) - Hero Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 7, '249', 1, 'Spencer Dales - (Excellence) - The Tenth'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 8, '250', 1, 'Spencer Dales - (Excellence) - Healing Magic'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 9, '251', 1, 'Spencer Dales - (Excellence) - Render Unconcious'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 10, '252', 1, 'Spencer Dales - (Excellence) - On The Run'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 11, '177', 1, 'The Governor & Woodbury - Character Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 12, '179', 1, 'The Governor & Woodbury - Penny'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 13, '180', 1, 'The Governor & Woodbury - We will take it...'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 14, '181', 1, 'The Governor & Woodbury - Welcome to Woodburry'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 15, '182', 1, 'The Governor & Woodbury - Bradley Fighting Vehicle'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 16, '191', 1, 'The Hilltop - Character Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 17, '193', 1, 'The Hilltop - Paul ''Jesus'' Monroe'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 18, '262', 3, '1 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 19, '263', 3, '2 Combat - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 20, '272', 3, '3 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 21, '273', 3, '4 Brute Force - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 22, '258', 3, '5 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 23, '259', 3, '6 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 24, '260', 3, '7 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 25, '261', 3, '8 Energy - Power Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 26, '294', 1, '6 Energy +2 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 27, '295', 1, '6 Energy +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 28, '296', 1, '7 Energy +3 - Universe: Basic Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 29, '311', 1, '5 Brute Force, 5 Intelligence +4 - Universe: Training Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 30, '407', 1, 'Walking Dead Mission Set # 1 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 31, '408', 1, 'Walking Dead Mission Set # 2 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 32, '409', 1, 'Walking Dead Mission Set # 3 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 33, '410', 1, 'Walking Dead Mission Set # 4 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 34, '411', 1, 'Walking Dead Mission Set # 5 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 35, '412', 1, 'Walking Dead Mission Set # 6 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 36, '413', 1, 'Walking Dead Mission Set # 7 - Mission Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 37, '414', 1, 'Walking Dead Event Card # 1 - Event Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 38, '415', 1, 'Walking Dead Event Card # 2 - Event Card'),
    ('a3520001-0000-4000-8000-000000000004'::uuid, 39, '416', 1, 'Walking Dead Event Card # 3 - Event Card');

CREATE TEMP TABLE tmp_preconstructed_catalog_sky ON COMMIT DROP AS
SELECT id::text AS card_id, 'character' AS card_type, set_number
    FROM characters
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'special' AS card_type, set_number
    FROM special_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'location' AS card_type, set_number
    FROM locations
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'mission' AS card_type, set_number
    FROM missions
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'event' AS card_type, set_number
    FROM events
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'aspect' AS card_type, set_number
    FROM aspects
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'advanced-universe' AS card_type, set_number
    FROM advanced_universe_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'teamwork' AS card_type, set_number
    FROM teamwork_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'ally-universe' AS card_type, set_number
    FROM ally_universe_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'training' AS card_type, set_number
    FROM training_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'basic-universe' AS card_type, set_number
    FROM basic_universe_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE
    UNION ALL
    SELECT id::text AS card_id, 'power' AS card_type, set_number
    FROM power_cards
    WHERE set = 'SKY' AND COALESCE(is_foil, FALSE) = FALSE;

DO $$
DECLARE
    precon_user_id UUID;
    unresolved TEXT;
    inserted_card_rows INTEGER;
BEGIN
    SELECT id INTO STRICT precon_user_id
    FROM users
    WHERE username = 'precon_decks';

    IF EXISTS (
        SELECT 1
        FROM decks
        WHERE id IN (
            SELECT deck_id FROM tmp_preconstructed_source_sky
        )
           OR (user_id = precon_user_id AND name IN ('We Are Invincible', 'We are the Walking Dead', 'Limitless Possibilities', 'Worlds Collide'))
    ) THEN
        RAISE EXCEPTION 'Skybound preconstructed deck target already exists';
    END IF;

    IF (SELECT COUNT(*) FROM tmp_preconstructed_source_sky) <> 160
       OR (SELECT SUM(quantity) FROM tmp_preconstructed_source_sky) <> 220
       OR EXISTS (
           SELECT 1
           FROM (
               SELECT deck_id, SUM(quantity) AS card_total
               FROM tmp_preconstructed_source_sky
               GROUP BY deck_id
           ) totals
           WHERE card_total <> 55
       ) THEN
        RAISE EXCEPTION 'Skybound workbook manifest count drift';
    END IF;

    SELECT string_agg(
        format('%s #%s (%s matches)', s.source_label, s.set_number, matched.match_count),
        '; ' ORDER BY s.deck_id, s.card_order
    )
    INTO unresolved
    FROM tmp_preconstructed_source_sky s
    CROSS JOIN LATERAL (
        SELECT COUNT(*) AS match_count
        FROM tmp_preconstructed_catalog_sky c
        WHERE c.set_number = s.set_number
    ) matched
    WHERE matched.match_count <> 1;

    IF unresolved IS NOT NULL THEN
        RAISE EXCEPTION 'Skybound preconstructed card resolution failed: %', unresolved;
    END IF;

    INSERT INTO decks (
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        is_private,
        is_limited,
        is_valid,
        card_count,
        threat,
        reserve_character
    ) VALUES
        ('a3520001-0000-4000-8000-000000000001'::uuid, precon_user_id, 'We Are Invincible', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL),
        ('a3520001-0000-4000-8000-000000000002'::uuid, precon_user_id, 'We are the Walking Dead', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL),
        ('a3520001-0000-4000-8000-000000000003'::uuid, precon_user_id, 'Limitless Possibilities', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL),
        ('a3520001-0000-4000-8000-000000000004'::uuid, precon_user_id, 'Worlds Collide', NULL, NOW(), NOW(), FALSE, TRUE, TRUE, 0, 0, NULL);

    INSERT INTO preconstructed_decks (
        deck_id, set_code, set_label, release_order, deck_order
    )
    SELECT
        manifest.deck_id,
        'SKY',
        'Skybound',
        2,
        manifest.deck_order
    FROM (VALUES
        ('a3520001-0000-4000-8000-000000000001'::uuid, 'We Are Invincible', 1),
        ('a3520001-0000-4000-8000-000000000002'::uuid, 'We are the Walking Dead', 2),
        ('a3520001-0000-4000-8000-000000000003'::uuid, 'Limitless Possibilities', 3),
        ('a3520001-0000-4000-8000-000000000004'::uuid, 'Worlds Collide', 4)
    ) AS manifest(deck_id, deck_name, deck_order);

    INSERT INTO deck_cards (
        deck_id, card_type, card_id, quantity, display_order
    )
    SELECT
        source.deck_id,
        catalog.card_type,
        catalog.card_id,
        source.quantity,
        source.card_order
    FROM tmp_preconstructed_source_sky source
    JOIN tmp_preconstructed_catalog_sky catalog
      ON catalog.set_number = source.set_number
    ORDER BY source.deck_id, source.card_order;

    GET DIAGNOSTICS inserted_card_rows = ROW_COUNT;
    IF inserted_card_rows <> 160 THEN
        RAISE EXCEPTION 'Expected 160 Skybound deck-card rows, inserted %', inserted_card_rows;
    END IF;

    UPDATE decks
    SET is_private = FALSE,
        is_limited = TRUE,
        is_valid = TRUE
    WHERE id IN (SELECT deck_id FROM tmp_preconstructed_source_sky);

    IF (SELECT COUNT(*) FROM preconstructed_decks WHERE set_code = 'SKY') <> 4
       OR (SELECT COUNT(*) FROM decks WHERE user_id = precon_user_id AND name IN ('We Are Invincible', 'We are the Walking Dead', 'Limitless Possibilities', 'Worlds Collide')) <> 4
       OR (SELECT COUNT(*) FROM deck_cards WHERE deck_id IN (
             SELECT deck_id FROM preconstructed_decks WHERE set_code = 'SKY'
           )) <> 160
       OR (SELECT SUM(quantity) FROM deck_cards WHERE deck_id IN (
             SELECT deck_id FROM preconstructed_decks WHERE set_code = 'SKY'
           )) <> 220
       OR EXISTS (
           SELECT 1
           FROM decks d
           JOIN preconstructed_decks pd ON pd.deck_id = d.id
           WHERE pd.set_code = 'SKY'
             AND (d.user_id <> precon_user_id OR d.is_private OR NOT d.is_limited)
       ) THEN
        RAISE EXCEPTION 'Skybound preconstructed deck verification failed';
    END IF;
END $$;
