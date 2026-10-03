# Excelsior Insomnia imports

Import either JSON file using Insomnia's file import. Each is a native collection export with 67 requests for the current Card Database, Deck Builder, Collection, and authentication contracts.

| File | Default HTTP base URL | Other environments |
| --- | --- | --- |
| `Excelsior-API.insomnia.json` | `http://localhost:8085` | Production `https://excelsior.cards`; isolated preparation API `http://localhost:8086` |
| `Excelsior-API-production.insomnia.json` | `https://excelsior.cards` | Production only |

## Authentication

Create a private Insomnia environment containing `username` and `password`. All supplied credential and token variables are blank. Do not commit populated exports.

- **Cookie:** send `Cookie login`, then `Cookie current user`. Insomnia stores the cookie for that host. Use the owned-deck and collection folders. `Cookie logout` ends this session.
- **Bearer:** send `Bearer login`; copy `data.accessToken` and `data.refreshToken` into private `access_token` and `refresh_token` variables. Verify `Bearer current user`. The Bearer examples deliberately disable cookies. Refresh rotates both tokens; replace both stored values. JWT logout revokes the supplied refresh token; access tokens expire according to their issued TTL.
- **Guest:** `Guest cookie login` uses the existing public Guest entry. Guest decks are session-specific. Guest collections are stored only in the browser and have no saved collection HTTP workflow.

These are existing player sessions and tokens. Server/service identities are a later preparation milestone; the exports do not invent a service key or account migration.

## First requests

1. Select the intended environment and send `/health/ready`.
2. Fetch a catalog and copy its `id` into `card_id`, its singular deck type into `card_type`, and its `image_path` into `image_path` when editing a collection.
3. Sign in. Create a disposable deck and copy `data.id` into `deck_id` (Guest creation uses `data.metadata.id` and `guest_deck_id`).
4. Deck validation sends `type`; deck card mutations send `cardType`. A validation HTTP 400 with `DECK_VALIDATION_FAILED` means the check completed and found an illegal deck. `is_valid` is owned by the server.
5. Collection POST creates/increments an owned printing. PUT changes that printing's quantity; quantity zero removes it. Card-ID DELETE removes all owned printings for that ID.

The production collection includes real write and delete requests. They run only when sent; importing sends nothing. Use the read requests to verify setup, and review the selected environment and IDs before sending a mutation.

## Local server and tunnel

The ordinary local API is `http://localhost:8085`; Vite is `http://localhost:5173`. The isolated preparation preview uses UI `http://localhost:5174` and API `http://localhost:8086` with a disposable local database.

Kyle has no prior Insomnia environment or HTTP tunnel workflow. These files establish it. The documented AWS SSM tunnel forwards **PostgreSQL**, not HTTP. Never use that database port as `base_url`. Direct production HTTP uses `https://excelsior.cards` and needs no database tunnel. A local API using a production database would be a separate, explicitly configured operational workflow; it is not this preparation environment.

Contracts: [`API_V1.md`](API_V1.md), [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md), and [`docs/current/FRONTEND_PREPARATION.md`](docs/current/FRONTEND_PREPARATION.md).
