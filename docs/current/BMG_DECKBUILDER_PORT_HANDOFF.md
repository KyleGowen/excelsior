# Builder-only service integration

Kyle authorized implementation on October 10, 2026 after reviewing the plan.
Baseline: 0d688aa17cd6fbcf34a9abc811626dd74d0269fb. This sanitized technical
handoff grants no ownership, license, or operational control over Excelsior.

Reuse existing service authentication. BMG catalog reads use the unchanged
database gateway; `/api/service/deckbuilder/v1` aliases only the four stateless
evaluation/candidate/draw/export POSTs. A separate bmg-deckbuilder identity has
catalog:read and decks:read only. No account, guest-deck, or persistence access.

Native `/api/apps/excelsior-deckbuilder` keeps the original request and player
checks for current builder operations. Native identity is verified in-process,
with existing per-player/IP limits; no external request bypasses service quotas.
The existing audit tables count each API attempt once using safe route templates.
The native UI, game rules, saved decks and Guest behavior must remain unchanged.

Runtime flags and edge changes default off. Local implementation and tests are
authorized; commits, pushes, deployments, real credentials and activation require
their existing explicit gates. No BMG CI/CD is added. The BMG preview may be
developed locally with fictional fixtures while the backend awaits release, but
live-readiness requires the accepted production gateway and issued credentials.

Only the builder dependency closure enters BMG. Preserve every original BMG
file except README.md. Guest draft state is per-tab session storage, survives
refresh, and never persists to an Excelsior deck. Save is disabled with Coming
soon. Export uses the current draft. Selector, login and other modules follow
later. Root human guides and canonical AGENTS.md/thin CLAUDE.md follow DBUI;
resources/{brand,mocks,assets} have concise READMEs and separate AGENTS.md.

## Operator activation handoff (not executed)

1. Review and release the accepted Excelsior changes under its normal gates. Keep both builder flags off until TLS routing and zero-TTL native edge behavior are ready; the existing catalog service remains intact. No BMG CI/CD is part of this handoff.
2. Register a distinct bmg-deckbuilder client using a cryptographically random secret delivered privately to BMG. Store only its SHA-256 digest in the service registry, grant catalog:read/decks:read, and retain the database UI client with catalog:read. Extend excelsior-web to catalog:read/decks:read/decks:write/guest:decks using its existing private native credential. Use the strict registry/credential schema in SERVICE_ACCESS.md; never expose values in logs, chat or Git.
3. Prepare `enable_native_deckbuilder_edge=true` and the accepted origin template. After reviewing edge/origin readiness, configure `app/deckbuilder_service_enabled=1` with the existing `app/database_service_enabled=1`. Existing preparation loads private files and validates both native identities before migration. Runtime enables ENABLE_DECKBUILDER_SERVICE_GATEWAY/ENABLE_NATIVE_DECKBUILDER_SERVICE. No new migration is required.
4. Give BMG the owner-only issued file path. Verify catalog/CDN reads plus all four previews, denial of writes/admin/player operations, native player behavior, and verified api_access_log/application aggregates. No player record should be created for BMG. Record live evidence separately from fixture checks.
5. To stop builder access, disable both builder flags and native edge behavior. Keep catalog access if DBUI remains active. If using strict production preparation with builder disabled, restore the accepted two-client catalog-only registry. Revoke the BMG builder identity if retiring access. Reload native UI configuration after rollback.

Real issuance, private delivery, deployment and activation await Kyle’s explicit authorization.
