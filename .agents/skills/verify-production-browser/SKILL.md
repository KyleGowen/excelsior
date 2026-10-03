---
name: verify-production-browser
description: Verify an intended deployed Excelsior revision with explicitly selected production-safe live browser scenarios and release health evidence. Use for post-release smoke checks; local success and mocked screens do not establish production behavior.
---

# Verify Production Browser

Check the identified deployed release while leaving decks, collections and other application records unchanged by default. This skill authorizes no commit, push, deployment, rollback, account mutation, infrastructure change or production database access on its own.

1. Read [deployment identity and production boundaries](references/production-runs.md). Reuse [Ship's release contract](../ship/SKILL.md): exact intended SHA, terminal matching deployment success with actual required jobs/tests, then cache-bypassed `/health` confirming that full SHA, application/database OK and expected migration. Preserve sanitized health evidence. If deployment identity is missing, stale or mismatched, report blocked; do not infer production success from local HEAD, a push or a green unrelated run.
2. Explicitly select a small subset from the [shared M1 scenarios and evidence matrix](../../../docs/current/BROWSER_TESTING.md). Reuse `tests/browser/milestone1.mjs` and `tests/helpers/browserEvidence.mjs`; never duplicate test logic in the skill. Confirm current public fixture URLs, card/image identity and expected deck metrics rather than copying past record IDs. Read-only fixture discovery/API checks support selection but do not replace browser interactions.
3. Bind a test-owned production tab through the available documented CUA surface, verify the actual origin/session and execute only selected read-only cases. Guest Home/menu, catalog search/detail/images, public read-only deck draw/redraw/export, Guest collection display and Supporter retirement have M1 live evidence. Keep account writes off; do not sign out a real user or clear their Guest storage to create a test state.
4. Wait for observed destination controls, verify navigation and rendered art, capture screenshots/results in a fresh evidence directory, inspect browser errors, and preserve failures before any bounded locator correction. Mark unselected or unavailable cases skipped/blocked, with reasons. Do not describe the extracted runner, mobile/theme/OAuth/host states or mutation cleanup as production-proven until actually executed there.
5. Close only test-owned tabs, reset temporary viewport overrides and confirm no application-record writes were performed. Report environment/URLs, intended/source/deployed revision, exact cases/subcases, passed/failed/skipped/blocked, evidence paths, cleanup and remaining gaps using the [report contract](../../../docs/current/BROWSER_TESTING.md#report-contract).

Tests that modify production data require Kyle's specific authorization for the target account/fixture, exact operations and defined restore/delete cleanup plan **before execution**. See the production reference; Ship authorization does not supply this permission. Missing access, credentials, fixture, browser tool or dependencies is an explicit limitation, not permission to create a production fixture.

For a post-ship browser failure, **ALERT LOUDLY**, show the failed case/evidence and give Kyle a scoped rollback option. Retain Supporter shelving. A rollback still needs his instruction and Ship gates; do not deploy automatically. A corrected harness failure can pass after evidence-backed rerun, with the initial failure disclosed.

Only live production results against the confirmed revision count as production validation. Automated pass does not imply Kyle's acceptance. Reuse unchanged M1 evidence for historical coverage; identify any newly extracted procedures still awaiting production verification.

## Efficient execution

Run explicitly selected shared scenarios in one `runMilestone1` call; emit `summarizeBrowserReport(report)` and retain full evidence. Default `capturePolicy: all` preserves captures. Before/after work sets `comparison: true`, rejecting failure-only capture. Optional `capturePolicy: failure` is for behavior-only smoke with no requested visual comparison. Inspect bounded failure evidence rather than dumping successful DOM/screenshots repeatedly. Never silently accept changed baselines.

Scripts handle fixed assertions. A bounded Luna Low executor may run only supplied read-only scenarios with exact target/session/fixture/cleanup constraints and fresh minimal context. Main-agent coverage selection, failure/visual interpretation, Kyle's acceptance and production-write authorization remain separate. Do not spawn a model to wait. Production packaging of the extracted runner remains unverified until an authorized live run.
