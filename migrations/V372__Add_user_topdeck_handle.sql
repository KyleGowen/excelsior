-- Optional, self-reported TopDeck profile handle. Never inferred from username.
ALTER TABLE users ADD COLUMN topdeck_handle VARCHAR(255);

COMMENT ON COLUMN users.topdeck_handle IS
    'Optional user-supplied TopDeck handle, without @; NULL means unset. Does not verify ownership.';
