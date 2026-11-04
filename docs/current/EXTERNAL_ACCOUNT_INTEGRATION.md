# External account and deck integration

Add a default-off confidential account gateway for explicitly granted account:self clients. Extend opted-in clients with decks:read and decks:write for current-player deck listing, loading, and atomic snapshot saving. The gateway ignores ambient native cookies/Bearer identity and transports independent upstream sessions in X-Excelsior-Account-Session. Native routes, cookie policy, hashing, and existing client grants retain their existing behavior.

TopDeck settings reuse the existing self-service validation and persistence. Deck writes derive the actor from the verified account session, compute game metrics on the backend, enforce ownership and optimistic concurrency, and persist cards/metadata/idempotency receipts atomically. ENABLE_ACCOUNT_SERVICE_GATEWAY and ENABLE_ACCOUNT_DECK_GATEWAY both default off. No deployed credentials, provider settings, or production data are changed by this source implementation.
