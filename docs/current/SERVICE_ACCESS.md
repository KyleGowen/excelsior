# Milestone 2: application access and player identity

The optional service-access path identifies a confidential server application separately from the player. The existing session and user JWT routes remain available. No production credentials or flags are provisioned by this change.

## Configuration and boundary

`ENABLE_SERVICE_ACCESS=1` requires `SERVICE_ACCESS_CONFIG_FILE`, a private JSON file (0600 on POSIX, at most 128 KiB). Its strict schema contains `environment`, a separate high-entropy `signingSecret`, `tokenTtlSeconds` (30–300), and a client registry. Every client has `id`, `enabled`, `tokenEpoch`, an explicit scope list, one or two `{ version, secretSha256 }` credentials, and `requestsPerMinute` (1–600). IDs, versions, scopes and credential hashes must be distinct. Production rejects development files and reuse of the player JWT signing key. File values and parse errors never enter HTTP errors or audit events.

`excelsior-web` and `lrg-web` are distinct development confidential clients. The raw secrets live only in a separate private host file selected by `APPLICATION_ACCESS_CREDENTIALS_FILE`: `{ environment, clients: [{ clientId, clientSecret }] }`. Neither file belongs in Git, the browser, a public environment or a committed Insomnia export. The local fixture helper generates cryptographically random values and emits paths and client IDs only:

```bash
node scripts/create-service-access-fixtures.mjs --dry-run --output /tmp/excelsior-service-fixtures --api http://127.0.0.1:8088
node scripts/create-service-access-fixtures.mjs --output /tmp/excelsior-service-fixtures --api http://127.0.0.1:8088
```

Choose a fresh output directory outside the checkout. The helper refuses production, remote origins, existing destinations and checkout destinations. Its private Insomnia environment export contains local credentials; import privately, keep it out of Git and delete it when the fixture lifetime ends. The helper does not start a server, change database configuration or grant production access.

## Issuance, scopes and revocation

`POST /api/v1/service-auth/token` accepts strict JSON `grant_type: client_credentials`, `client_id`, `client_secret`, and optional space-separated `scope`. Success uses the v1 envelope with `accessToken`, `tokenType: Bearer`, `expiresInSeconds`, `scopes`. Send the service token as `X-Excelsior-Service-Authorization: Bearer <token>`. Player identity still arrives separately as a session cookie or ordinary player `Authorization: Bearer <token>`.

Service JWTs use HS256, issuer `excelsior-service-access`, audience `excelsior-api-v1`, and explicit type `excelsior-service+jwt`. They carry client ID, scopes, credential version, epoch, issued/expiry times and a random token ID; never a user ID or role. Validation fixes algorithm, issuer, audience, type and lifetime and checks the current registry each time. A player JWT cannot be a service JWT and a service JWT cannot authenticate a player. Token strings, secrets, cookies, query values, Guest deck IDs containing session tokens, and auth bodies are redacted from request logs. Audit events report client ID where verified, allowed/denied/throttled outcome, operation scope (no record IDs), error code and request ID; they contain no player credentials or request payload.

Scopes are `catalog:read`, `decks:read`, `decks:write`, `collections:read`, `collections:write`, `auth:session`, `guest:decks`. `serviceOperations.ts` enumerates supported ordinary frontend operations. Unknown and administrative operations are denied when a service header is supplied. Absence of a service header preserves direct API compatibility, including the existing separately authenticated admin routes. A valid application token does not bypass player checks, deck ownership, owned Collection access or Guest-session isolation. Existing persistent decks are link-readable even when unlisted (`is_private`); that listing flag is not a private-read ACL. The adapter preserves this contract.

Issuance has an additional 15/IP/minute limit. Issuance and authenticated API requests share each client's process-local minute budget. HTTP 429 supplies Retry-After; these limits are not a distributed production quota. Disable a client or increment its epoch to revoke all its tokens; remove a credential version to retire that version; reducing scopes/TTL or replacing the signing key also invalidates incompatible tokens on the next check. Rotation permits two distinct versions briefly: add new hash, update the host's private credential, verify issuance, then remove old version. Atomically replace private files. There is no per-token database revocation store. Distributed deployment, private secret delivery and coordinated rotation need separately approved production provisioning. Service-bearing requests must reach the API origin rather than an existing public catalog CDN cache; verify cache-policy bypass or a dedicated trusted origin before enabling production. Origin no-store headers alone cannot retroactively bypass already cached anonymous catalog responses.

## Application adapters and frontend transport

`ApplicationAccessAdapter` lives only in backend code. Its fixed API origin permits HTTPS or loopback HTTP outside production, blocks credentials/path/query in that origin, prevents redirects, restricts operations and applies request timeouts. It caches only a short-lived service token, with single-flight issuance and a 5-second expiry buffer. Each call supplies its own player credential. It rereads credentials on issuance and retries once only for `SERVICE_TOKEN_INVALID`; a player 401 does not renew service identity. No player data or credentials are cached between requests.

`ENABLE_EXCELSIOR_ACCESS_ADAPTER=1` and a configured `APPLICATION_ACCESS_API_ORIGIN` enable the same-origin Express adapter for supported `/api` calls. Browser cookie login and UI routes do not change. A separate server adapter instance uses `lrg-web`. In non-production only, `ENABLE_APPLICATION_ACCESS_FIXTURES=1` exposes `/api/host-fixtures/excelsior/api/...` and `/api/host-fixtures/lrg/api/...` to exercise those server instances. These are local fixture mounts, not an LRG deployment or the Milestone 5 independent module harness.

The server forwards one player auth mode, request IDs, ETags, separate Set-Cookie headers and rate-limit evidence. Authentication, explicit service-bearing responses and proxied responses use no-store; direct public catalog caching remains unchanged. `frontend/src/lib/api/client.ts` exposes `createApiClient` for a public API origin/host prefix, credentials policy, asynchronous player-header provider and bounded single-flight user renewal. Existing exports retain same-origin cookie behavior. Browser header providers reject service credentials; server keys and signing keys are never imported into frontend code. Explicit login/signup/Google/refresh/logout actions are not silently retried by the user-renewal callback.

## Compatibility and rollout

Production flags default off, so current direct player API calls, browser cookie behavior, CORS and the CDN path remain unchanged. No Origin header is needed by a non-browser API client. CORS remains an explicit browser-origin policy and does not authenticate application identity; no browser CORS allowlist for the service-secret header is added. Do not invent a localhost/AWS-tunnel authentication bypass. The documented SSM tunnel forwards PostgreSQL, not HTTP.

The local same-process adapter uses a fixed loopback backend and existing limits; forwarded player IP attribution and multi-process client quotas require deployment design before production enablement. The supported operation subset excludes admin and some account/community utilities. Expanding a separate host must explicitly add the needed ordinary operations and tests rather than treating its service scope as unrestricted access. Production activation, an LRG host and real Google OAuth remain future verification boundaries.

## Evidence and handoff

Unit tests cover scope/credential denial, token confusion, expiry, revocation/rotation, independent budgets, private configuration, adapter retries and player isolation, actual structured-log redaction, transport errors and renewal. `tests/integration/service-auth-adapters.test.ts` uses the actual `src/index.ts` composition and PostgreSQL; it verifies both client adapters, cookie/JWT player identity, ownership, collections, Guest isolation, revocation renewal, refresh reuse/family revocation and logout. This differs from the repository test-server's authentication shim.

The selected M1 CUA browser cases are rerun against the ordinary UI with its local Excelsior adapter enabled. Browser evidence is stored under `docs/evidence/frontend-preparation/m2/`. Unit and HTTP integration tests do not prove browser behavior or production validation. The implementation ledger records executed cases, revisions, cleanup and gaps. Kyle's spot-check acceptance must be recorded separately before shipping. No production tests are part of M2 implementation.

Design references: [OAuth confidential client credentials](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4), [JWT validation guidance](https://www.rfc-editor.org/rfc/rfc8725.html). This API uses its existing camelCase v1 envelope; it does not claim to be a complete interoperable OAuth authorization server.
