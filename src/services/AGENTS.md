# Shared backend service context

Follow root AGENTS.md and src/api/.cursorrules for API work. This directory owns shared business behavior; HTTP orchestration in AuthenticationService is existing legacy code, not a pattern for new business rules. AuthenticationService and database/sessionRepository.ts are the authority for native login, Google signup, session TTL, and logout. src/api/services/userAccountService.ts owns profile/provider/role rules.

External account preparation reuses those services unchanged. Do not change password hashing, native cookie attributes, session expiry, account-wide revocation, or keys to support an external UI. The current logout helper catches deletion failures; document that limitation rather than claiming guaranteed revocation. See docs/current/FRONTEND_AUTH_AND_SESSION.md and EXTERNAL_ACCOUNT_ACCESS.md.
