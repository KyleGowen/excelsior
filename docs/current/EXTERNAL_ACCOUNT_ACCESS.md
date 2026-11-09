# External account gateway preparation

Sanitized handoff: prepare a reusable account UI for independently hosted clients.
This is additive backend work on a feature branch. The owner will choose when to
merge/deploy after the tournament. Do not activate production access, rotate any
existing credentials, migrate data, or change the native frontend for this task.
Excelsior remains independently governed and Kyle-owned; this integration grants
no ownership, license, or operational control over it.

## Activation and isolation

`ENABLE_ACCOUNT_SERVICE_GATEWAY=1` opts into `/api/service/account/v1`.
It is off when absent, including after merging this branch. Also require the
existing `ENABLE_SERVICE_ACCESS=1` configuration and a separately provisioned
confidential client explicitly granted `account:self`. No existing client gains
that scope automatically. The catalog/builder gateways and shared
`serviceOperations.ts` allowlist are unchanged.

Obtain a short-lived service token from the existing
`POST /api/v1/service-auth/token`; request `scope: "account:self"`. Use
`X-Excelsior-Service-Authorization: Bearer <token>` only from a trusted host
server. Player identity is separate. A service token alone cannot read or update
an account. Production gateway requests require origin HTTPS. The trusted proxy,
origin routing, secret provisioning, cache bypass, and production activation are
separate operational work; no infrastructure is provisioned here.

The gateway ignores ordinary Cookie and Authorization headers. An independently
created upstream session is supplied explicitly in
`X-Excelsior-Account-Session: <64-character lowercase hex token>`. New/renewed
session cookies are converted to that private response header; no Set-Cookie is
forwarded. An empty session response header represents logout clearing. Never
expose that header or token to browser JavaScript, logs, URLs, or a public cache.
Structured request/response logging redacts the header. Responses are no-store.

The host keeps this upstream credential in its private SessionStore and gives the
browser a different opaque, host-only HttpOnly cookie. It must never populate
the header from an ambient Excelsior browser cookie or client-supplied token.
Explicit sign-in creates a new upstream session. Logout selects only that host's
upstream session. This provides independent website sessions, not separate user
databases: profile changes still update the underlying Excelsior account.

## Literal operation allowlist

Append each path below to `/api/service/account/v1`. Payloads and success/error
envelopes are exactly those of the target handler; gateway errors use the v1
envelope. The consumer adapter must normalize these two envelope families.

| Method and suffix | Existing target | Body / result |
| --- | --- | --- |
| POST `/auth/login` | `/api/auth/login` | `{ username, password }`; legacy user identity, session header |
| POST `/auth/signup` | `/api/auth/signup` | `{ username, email, password }`; USER creation, session header |
| POST `/auth/google/preview` | `/api/auth/google/preview` | `{ idToken }`; registration preview, no session |
| POST `/auth/google` | `/api/auth/google` | `{ idToken, confirmRegistration }`; existing Firebase verification, session header |
| POST `/auth/logout` | `/api/auth/logout` | Supplied private session only; legacy result, empty session header |
| GET `/auth/me` | `/api/auth/me` | Supplied private session; legacy full public user record |
| GET `/config/firebase` | `/api/config/firebase` | Bare public Firebase client config; still service-gated here |
| POST `/users/change-email` | `/api/v1/users/change-email` | `{ email }`; session USER/ADMIN, password provider |
| POST `/users/change-password` | `/api/v1/users/change-password` | `{ newPassword, confirmPassword }`; same role/provider checks |
| POST `/users/display-name` | `/api/v1/users/display-name` | `{ displayName }`; unique login rename or Google display name |
| POST `/users/topdeck` | `/api/v1/users/topdeck` | `{ topdeckHandle }`; existing self-service handle validation and persistence |

Unknown paths, trailing slashes, encoded variants, wrong methods, arbitrary user
IDs, admin, collections, guest persistence, and token refresh are not
gateway operations. Deck operations require the additional opt-in contract below.
Administrative access remains unavailable even for ADMIN.
Body role/user selectors never select the actor. All existing account services,
validation, password hashing, session expiry and provider rules are reused.

The gateway uses the existing default JSON limit (100 KiB); malformed or oversized
service JSON returns a sanitized 400/413. Service issuance/request budgets still
apply. Login, signup, and Google attempts share a separate 15/IP/minute budget
whose keys cannot consume the native login budget. In a server-to-server host
this IP may be its egress address; the host must also enforce per-viewer/account
distributed limits from trusted connection context. Do not forward arbitrary
browser forwarding headers to evade or partition upstream limits.

## Compatibility and known limits

Native `/api/auth/*`, `/api/v1/auth/*`, profile URLs, native cookies, keys, roles,
Firebase lifecycle, and the current UIs are unchanged. No migration or credential
reissue is needed merely to merge disabled preparation.

Native logout catches a session-store delete failure. The new gateway reuses this
behavior and cannot guarantee upstream revocation when storage fails. A host must
revoke its own local session immediately, never restore it after upstream failure,
and record the limitation without logging tokens. Fixing native logout is separate
work. Sensitive profile changes have no new native recent-auth requirement; the
independent host must enforce its own policy before calling them.

## Verification and independent test kit

`tests/unit/api/account-service.test.ts` covers the exact allowlist, defaults,
scope/token denial and revocation, transport, private session headers, ambient
cookie isolation, throttling, JSON failures, no-store, native compatibility, and
log redaction. `tests/integration/account-service.integration.test.ts` uses actual
production composition and PostgreSQL for signup/login/profile, role/provider
rules, expiry, two independent sessions and native logout in both directions.
Existing provider verification tests remain authoritative for Firebase assertions.

Run the guarded disposable-database integration gate, not a production endpoint:

```bash
bash scripts/ship-conditional-test.sh unit
bash scripts/ship-conditional-test.sh integration
bash scripts/soc2-compliance-checks.sh
```

Build the frontend before the broad integration gate because its unrelated HTML
route checks require the real SPA shell. Use the owning ship skill for all gates.
An independent consumer can download a source test kit prepared by
`scripts/package-account-test-kit.mjs` from the exact committed preparation SHA.
The kit contains backend source, locked dependencies, migrations, and the selected
account integration tests; it omits production data/configuration and card art.
Its consumer verifies SHA-256 before extraction, installs with `npm ci`, runs a
disposable PostgreSQL/Flyway fixture, and selects only the account test. This is
real backend contract evidence, separate from mock/demo tests. Pin the source SHA
and archive digest in the consumer; never silently track a moving branch.

## Confidential account deck snapshots

The default-off account gateway adds `GET /api/service/account/v1/decks`, `GET /api/service/account/v1/decks/{uuid}/full`, and `POST /api/service/account/v1/decks/save`. These require `account:self` plus `decks:read` or `decks:write` respectively and the private `X-Excelsior-Account-Session` header. A service token does not choose or grant a player. Both gateway flags must be enabled. Native aliases are guarded and cannot be called using ordinary cookies.

Save accepts exactly operationId, deckId, expectedUpdatedAt, name, cards, reserveCharacterId and limited. New decks require null deckId/revision; updates require both returned values. Cards have unique typed UUID identities, bounded quantities and optional pre-placement. The server evaluates game metrics, verifies ownership and commits metadata, cards, preview metadata and a per-player idempotency receipt in one transaction. Reusing an operation UUID with changed input or a stale revision returns 409. After a timeout, explicitly retry the same operation and payload; never generate another create UUID automatically. A successful response contains metadata (including userId/isOwner), cards and the exact updatedAt revision. Reads retain existing shared-read semantics; writes require ownership. All responses are no-store and errors are sanitized.

The additive receipt migration must run through the owning serialized migration workflow before enabling writes. Runtime uses DML only. Native auth cookies/session behavior remains independent; diagnostic helpers redact all session bytes. Neither source preparation nor fixture success proves a deployed gateway or grants release permission.

New kits produced by the official helper require the complete account/deck source and both contract tests, include the receipt migration, and identify `account-decks-snapshot-v1` in schema version 2 provenance. Existing schema version 1 archives retain their original meaning and must not be relabeled as deck-contract evidence. Packaging tests use only disposable synthetic Git repositories; they do not create application commits or establish real backend compatibility.


## Production configuration handoff

The existing deployment preparation reads independent opt-in SSM settings app/account_service_enabled and app/account_decks_enabled. Account access requires catalog service access; account decks also require builder access. When enabled, the shared independently hosted account UI uses one dedicated bmg-shared-account-ui client with account:self, decks:read and decks:write. The existing native and catalog clients retain their exact scope checks. The service registry stores only the client digest, while each consumer retains its own private credential file. Runtime activation and live verification are separate from source delivery; this change creates no client or activation setting itself.

## Owner selection account extension

The enabled confidential account gateway adds POST `/api/service/account/v1/decks/import`, `/decks/delete` and `/decks/metadata` with exact aliases. Import accepts operationId UUID, name and the native JSON/TopDeck exportData contract; complete server resolution precedes one atomic snapshot/receipt. Unresolved imports return data `{ok:false,code,message,unresolved}` with no write. Delete and metadata require operationId, deckId and the opaque microsecond expectedUpdatedAt token; metadata allows name, description and isPrivate. Ownership is reconstructed from the authenticated player, never input. Conflicts return409, wrong owners403, missing decks404, invalid bodies400, and unavailable storage503. Receipts survive deck deletion; retrying a prior successful operation returns its original result without resurrecting data.

Account GET `/decks` now returns rich owner snapshots (metadata, art-only ordered cards, fresh server evaluation, grid and missionSetName) using one bulk SQL statement and one catalog resolution. A missing evaluation is unavailable, not confirmed legality. Full snapshots retain description/visibility and ordinary saves preserve omitted fields. New stateless POST `/api/v1/decks/import/prepare` and its confidential deckbuilder alias accept native import input and return resolved draft/evaluation or unresolved diagnostics, with no player or persistence. Old routes remain compatible.
