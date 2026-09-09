-- deck_cards aggregates identical physical copies into one row. When that row
-- is marked exclude_from_draw, exactly one copy is pre-placed; the remaining
-- quantity stays in the draw pile.

CREATE OR REPLACE FUNCTION deck_card_count_contribution(
    card_type_value VARCHAR,
    quantity_value INTEGER,
    exclude_from_draw_value BOOLEAN
)
RETURNS INTEGER AS $$
    SELECT CASE
        WHEN card_type_value IN ('character', 'location', 'battleground', 'mission') THEN 0
        ELSE GREATEST(
            COALESCE(quantity_value, 1)
                - CASE WHEN exclude_from_draw_value IS TRUE THEN 1 ELSE 0 END,
            0
        )
    END;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
DECLARE
    old_contribution INTEGER := 0;
    new_contribution INTEGER := 0;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_contribution := deck_card_count_contribution(
            NEW.card_type,
            NEW.quantity,
            NEW.exclude_from_draw
        );
        IF new_contribution <> 0 THEN
            UPDATE decks
               SET card_count = card_count + new_contribution,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        old_contribution := deck_card_count_contribution(
            OLD.card_type,
            OLD.quantity,
            OLD.exclude_from_draw
        );
        new_contribution := deck_card_count_contribution(
            NEW.card_type,
            NEW.quantity,
            NEW.exclude_from_draw
        );

        IF OLD.deck_id = NEW.deck_id THEN
            IF old_contribution <> new_contribution THEN
                UPDATE decks
                   SET card_count = card_count - old_contribution + new_contribution,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = NEW.deck_id;
            END IF;
        ELSE
            UPDATE decks
               SET card_count = card_count - old_contribution,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = OLD.deck_id;
            UPDATE decks
               SET card_count = card_count + new_contribution,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        old_contribution := deck_card_count_contribution(
            OLD.card_type,
            OLD.quantity,
            OLD.exclude_from_draw
        );
        IF old_contribution <> 0 THEN
            UPDATE decks
               SET card_count = card_count - old_contribution,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = OLD.deck_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

UPDATE decks d
SET card_count = counts.card_count
FROM (
    SELECT
        d2.id AS deck_id,
        COALESCE(SUM(deck_card_count_contribution(
            dc.card_type,
            dc.quantity,
            dc.exclude_from_draw
        )), 0)::INTEGER AS card_count
    FROM decks d2
    LEFT JOIN deck_cards dc ON dc.deck_id = d2.id
    GROUP BY d2.id
) counts
WHERE d.id = counts.deck_id;

COMMENT ON COLUMN deck_cards.exclude_from_draw IS
    'True when one physical copy in this aggregated card row starts pre-placed outside the draw pile.';

COMMENT ON COLUMN decks.card_count IS
    'Draw-pile count excluding structural cards and one physical copy from each pre-placed card group.';
