---
name: reset-production-user-password
description: >-
  Reset one named Excelsior production user's password through the guarded SSM
  PostgreSQL path. Use when Kyle supplies a username and a new password and
  explicitly asks to reset that production account.
---

# Reset Production User Password

Reset exactly one production password while protecting credentials and avoiding
changes to an unintended account.

## Required input and authorization

Require a `username` and a new plain-text password. The request must also
explicitly authorize resetting that production user's password; do not infer
authorization from a request to look up, inspect, or diagnose an account.

Never print, log, commit, or add the new password, database password, or a
password hash to files, reports, or memory. Do not reset Google-linked accounts.

## Prerequisites

Read and follow [Start AWS DB Tunnel](../start-aws-db-tunnel/SKILL.md) before
database access. First check `lsof -nP -iTCP:15432 -sTCP:LISTEN`. If no listener
exists, use that skill to validate AWS identity, resolve the running
`op-deckbuilder-app` instance, verify Systems Manager is online, and start the
tunnel. The production target is `127.0.0.1:15432`, not a local database.

Before a reset, inspect `src/utils/passwordUtils.ts` and
`src/database/PostgreSQLUserRepository.ts` to confirm the current hashing
contract. At present it is bcrypt with 10 rounds.

## Guarded reset

1. Fetch the database connection password from AWS SSM without outputting it,
   then connect through the tunnel using SSL.
2. Run a read-only query for the supplied exact username. Return only safe
   account metadata needed to establish identity: id, username, email, role,
   auth provider, and whether a password hash exists. Never select or display
   the password hash in user-facing output.
3. Stop if zero or multiple accounts match, the username differs, the account
   is not password-authenticated, or it lacks a password hash. Report the
   non-secret mismatch and ask for direction; do not fall back to a different
   account or alter an SSO account.
4. In a single transaction, re-read the exact verified id with `FOR UPDATE`,
   check the same identity and auth-provider conditions again, generate a
   bcrypt hash using the application’s configured rounds, and issue a guarded
   `UPDATE` constrained by id, username, and `auth_provider = 'password'`.
   Require exactly one updated row; otherwise roll back.
5. Before committing, verify the stored resulting hash with `bcrypt.compare`
   against the requested new password. Commit only when it succeeds; roll back
   on every error.
6. Report the reset as completed without echoing the password or any hash. If
   Kyle asks for credential delivery, use a secure local mechanism such as the
   macOS clipboard rather than chat; do not send email or other messages without
   separate authorization.

Use an explicit transaction-capable client/script for the production mutation;
do not paste a raw hash into SQL or perform an unguarded update. Keep the
operation limited to the named account and do not modify roles, profile data,
authentication providers, sessions, or unrelated accounts.
