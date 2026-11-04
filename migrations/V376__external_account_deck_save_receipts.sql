CREATE TABLE external_deck_save_receipts (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  request_hash char(64) NOT NULL,
  deck_id uuid NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (user_id, operation_id)
);
CREATE INDEX external_deck_save_receipts_created_at_idx ON external_deck_save_receipts(created_at);
