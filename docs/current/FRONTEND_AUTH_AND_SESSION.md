# Frontend authentication and account guide

This guide describes the current React SPA and backend source, not production
configuration. Native behavior is preserved while the external account gateway
is prepared. See [the external account handoff](EXTERNAL_ACCOUNT_ACCESS.md) for
its separate opt-in contract.

## Source map

| Responsibility | Source |
| --- | --- |
| Account menu, forms, dropdown/sheet, guest warning, host navigation | [ProfileMenuContent](../../frontend/src/components/ProfileMenu/ProfileMenuContent.tsx) |
| Identity bootstrap, account switching, query cleanup, Google lifecycle | [AuthProvider](../../frontend/src/app/AuthProvider.tsx) |
| Legacy response normalization and guest bootstrap | [auth client](../../frontend/src/lib/api/auth.ts) |
| Profile requests | [account client](../../frontend/src/lib/api/account.ts) |
| Firebase popup/redirect client | [googleAuthClient](../../frontend/src/lib/auth/googleAuthClient.ts) |
| Safe return navigation | [postAuthNavigation](../../frontend/src/lib/auth/postAuthNavigation.ts) |
| Session creation/validation and signup/Google/logout handlers | [AuthenticationService](../../src/services/AuthenticationService.ts) |
| Session storage and expiry | [sessionRepository](../../src/database/sessionRepository.ts) |
| Account rules | [UserAccountService](../../src/api/services/userAccountService.ts) |
| HTTP registration | [legacy auth routes](../../src/routes/auth.routes.ts), [v1 account routes](../../src/api/http/users.http.ts), [v1 token auth](../../src/api/http/auth.http.ts) |

## Native session flow

The SPA calls GET `/api/auth/me`. Its legacy success data uses `id` and
`name`; login/signup use `userId` and `username`. The client normalizes
these differences. Only a 401 means no current session; network/server failures
remain errors with retry rather than silently changing the user to Guest.

POST `/api/auth/login` accepts `{ username, password }`; the login field
supports the existing username/email credential lookup. POST
`/api/auth/signup` accepts `{ username, email, password }`, checks duplicate
username/email and email format, creates a USER, and starts a session. The
backend chooses the role. Success uses `{ success, data }`; errors use
`{ success: false, error }`. See [legacy API documentation](../../API_DOCUMENTATION.md).

Sessions are cryptographically random 32-byte hex tokens stored in PostgreSQL.
They have a sliding two-hour inactivity expiry. Validation slides database
expiry; the authentication middleware also renews the cookie. The dedicated
legacy `/me` handler validates/slides the database session but does not itself
issue a replacement cookie.

The browser cookie is `sessionId`, HttpOnly, with deterministic flags from
[authCookieOptions](../../src/services/authCookieOptions.ts). Secure/Strict is
explicitly selected by `COOKIE_SECURE=true`; the fallback is Lax without
Secure. Do not change flags, expiry, hashing, keys, or stored credentials as
part of external-component preparation.

POST `/api/auth/logout` deletes the supplied session token and clears its
cookie. The SPA then starts Guest mode. There is a known limitation:
`destroySession` catches repository deletion errors, so an HTTP logout success
is not proof of revocation during a store failure. This preparation preserves
native behavior. A future host must always destroy its own local session and
must not claim guaranteed upstream revocation under that failure.

## Guest mode and host ownership

The native SPA starts the seeded Guest account using `guest` / `guest`
when no valid session exists. Omitting the password does not work. Native
session guest decks use the existing guest deck service; they do not become
ordinary saved account decks. Signing in does not automatically transfer them.

A standalone external component should represent a logged-out Guest locally.
Public browsing and host-owned per-tab drafts must work without an upstream
login, service credential in the browser, or a server guest deck. The account
gateway deliberately exposes no deck or collection operation. The current
native guest flow is not being replaced.

The host owns routes, deck count, draft storage, collections, Help/Feedback,
and navigation. A reusable account component should take data/callbacks for
these features rather than importing database/deckbuilder internals.
AuthProvider currently removes identity-dependent query data on account
changes. Preserve the host's draft rules separately from that cache cleanup.
[Post-auth navigation](../../frontend/src/lib/auth/postAuthNavigation.ts)
prevents returning to writable resources belonging to the previous identity.

## Google sign-in

The SPA loads public Firebase configuration from GET `/api/config/firebase`,
preloads Firebase, and starts a popup directly from user interaction. It offers
redirect fallback and processes the redirect result once. Both paths obtain a
Firebase ID token and complete through POST `/api/auth/google` with
`{ idToken, confirmRegistration: true }`. POST
`/api/auth/google/preview` verifies the token and reports existing versus new
account without creating a session. The backend validates the Firebase token
and controls registration/linking. Missing provider configuration and invalid
tokens remain failures.

There is no mounted GET OAuth redirect/callback pair at
`/api/auth/google` or `/api/auth/google/callback`. Do not implement a consumer
from those historical URLs.

The existing Firebase client reuses the first initialized Firebase app. A future
independent host must use an explicit named app and scoped persistence, safe
return paths, and its own provider lifecycle. Provider-authorized domains and
non-production test configuration need separate setup. Do not change native
Firebase behavior for this preparation.

## Account features and roles

| Feature | GUEST | Password USER/ADMIN | Google USER/ADMIN |
| --- | --- | --- | --- |
| Login/signup/Google entry | Available | Account already signed in | Account already signed in |
| Username/display-name edit | Denied | Renames unique username and login ID | Changes public display name only |
| Email edit | Denied | Validated; duplicate/unchanged errors | Denied by backend |
| Password edit and confirmation | Denied | Must match; existing hash implementation | Denied by backend |
| Logout | Available through native host | Supplied session only | Supplied session only |
| Help, Create Deck, deck count | Host-owned | Host-owned | Host-owned |
| Administration | Denied | ADMIN only on native site | ADMIN only on native site |

Profile mutations use POST `/api/v1/users/change-email` (`{ email }`),
`/users/change-password` (`{ newPassword, confirmPassword }`), and
`/users/display-name` (`{ displayName }`), with the current session and v1
`{ data, meta, errors }` envelopes. The actor comes from the authenticated
session. Body-supplied user IDs/roles confer no authority.

The native menu currently includes User Analytics and BizOps links for ADMIN.
A future external component may show disabled placeholders; it receives no
admin API access. Keep native administration behavior unchanged. Existing
profile updates do not require current-password reauthentication; a future
host's recent-auth policy must be documented and enforced separately.

## JWT API is a distinct contract

The native account UI uses cookie auth, not the v1 token flow. POST
`/api/v1/auth/login` returns `data.accessToken`, `tokenType`,
`expiresInSeconds`, `user: { id, username, role }`, and optional
`refreshToken` / `refreshExpiresInSeconds`. Access TTL is
`JWT_ACCESS_TTL` (15m default); refresh TTL is `JWT_REFRESH_TTL_SECONDS`
(30 days default). `JWT_SECRET` is required in production.

GET `/api/v1/auth/me` currently requires a player Bearer JWT. POST
`/api/v1/auth/refresh` rotates a body-supplied refresh token. POST
`/api/v1/auth/logout` best-effort revokes the body-supplied refresh token;
it does not destroy the native session cookie or revoke an already issued
access JWT. Do not substitute these endpoints for native session logout.
See [API v1](../../API_V1.md) and [refresh behavior](API_V1_AUTH_REFRESH.md).

## Verification and change boundaries

Existing auth tests include `tests/unit/AuthenticationService.test.ts`,
`authenticationServiceAuthorization.test.ts`, `authCookieOptions.test.ts`,
`api/http/auth.http.test.ts`, and frontend auth/navigation tests. External
gateway coverage is in `tests/unit/api/account-service.test.ts` and
`tests/integration/account-service.integration.test.ts`.

Use isolated fictional accounts and disposable databases. No production account
testing, migrations, credential rotation, or flag activation is part of this
preparation. A feature branch runs CI; merging main can deploy. The human owner
chooses that release time after the tournament.
