# Database-only service integration handoff

Kyle authorized implementation on October 6, 2026. This is a sanitized technical
handoff into Excelsior; it grants no product ownership, license, or control.
Baseline: `e11c0a0144997f47ccf6dfa2ccad252d99fcc140`.

## Required order and acceptance gates

1. Complete all Excelsior code, migrations, transport configuration, native
   database attribution, tests, and local verification first. Preserve existing
   appearance, behavior, accounts, decks, collections, and catalog/image contracts.
2. **STOP before commit, push, deployment, or production activation.** Leave an
   identified local preview and evidence for Kyle. His explicit local acceptance
   and shipping instruction are required before release.
3. Release the accepted Excelsior change through the existing release gates.
   Capture deployed revision, health, read-only smoke checks, and rollback state.
4. **STOP after shipping.** Kyle must verify and accept the identified production
   version. Do not begin any BMG/LRG implementation before that acceptance.
5. After acceptance, implement BMG's database-only host, local confidential
   server, shared API/CDN image behavior, source provenance, tests, branding,
   root README, and minimal Codex/Claude instructions. Pause for BMG local
   acceptance before any eventual release; BMG CI/CD and deployment are deferred.

## Excelsior scope

- Reuse existing service token issuance, validation, rotation, and revocation.
  Separate native and BMG application identities and quotas; BMG has catalog-read
  permission only. Secrets never enter browser bundles or request logs.
- Add a mandatory-authentication, explicit database-operation service path with
  no shared CDN caching and verified HTTPS through the application origin.
  Preserve existing public API/cache and image-CDN paths.
- Route native database reads through a same-origin confidential adapter with
  verified attribution. Preserve native caller rate-limit identity and current
  user/Guest behavior. Do not globally enable the broad preparation adapter.
- Add additive Flyway request-attribution fields and per-application aggregate
  counts. Preserve existing metrics. Canonicalize route keys, redact payloads,
  capture failures, and avoid counting outer/inner adapter requests twice.
- Counters measure requests received by the API, including each retry attempt;
  query-cache reuse and CDN image downloads are excluded. Unknown identities
  must not be promoted using caller-supplied labels.
- Provide meaningful unit/edge-case coverage, real HTTP/migration integration,
  before/after desktop/mobile browser evidence, and explicit rollback switches.
- Keep contract and operational notes limited to those needed for this change;
  broad documentation and new agentic skills are deferred.

## BMG scope reserved for the later phase

Only the database dependency/style closure is copied from a verified revision.
Saved views, login/account management, decks, and collections are out of scope.
Add-to-deck and add-to-collection are disabled with accessible Coming soon
tooltips. API presentation metadata and the existing image renderer/path rules
remain authoritative. Card ingestion stays in Excelsior.

Resources belong in `/resources/brand`, `/resources/mocks`, and
`/resources/assets`. Human documentation stays at the repository root except
succinct resource-folder READMEs; each resource folder has separate AGENTS.md
context. Root CLAUDE.md imports canonical AGENTS.md. Actual deckbuilder assets
and font licenses remain to be inspected when repository access is available.

## Release checkpoint

Kyle accepted the identified local preview and explicitly authorized the Ship
skill on October 6, 2026. The isolated preview uses disposable data; automated
unit, database integration, builds, lint and security checks passed. Browser
baselines passed before editing; automated after-change visual comparison was
blocked by unavailable browser policy verification. Kyle completed local review.

The Ship release must retain exact-commit deployment and health receipts,
production gateway/attribution checks, and rollback evidence. Production
acceptance remains a separate human gate. BMG implementation stays deferred
until Kyle explicitly accepts production. Retain the isolated local preview
until acceptance or cancellation; clean up only resources owned by this run.
