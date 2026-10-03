---
name: test-local-browser
description: Verify selected Excelsior workflows in the live local browser, capture comparable before/after evidence, and prepare Kyle's spot check. Use for local UI testing or browser regressions; use verify-production-browser for deployed releases.
---

# Test Local Browser

Produce evidence from the intended running app, then hand off a concrete preview. Automated success is distinct from Kyle's explicit acceptance. This skill does not authorize commit, push, deployment, production testing, or broader cleanup.

1. Load the active root/path instructions. Inspect the task scope, intended checkout and diff. Read [local target and fixtures](references/local-runs.md) before startup or writes. Reuse [Start Excelsior](../start-excelsior/SKILL.md) to verify API `http://localhost:8085/health` and frontend `http://localhost:5173`. Confirm the running source, Vite proxy and database binding match the target; health SHA alone does not identify uncommitted code. Preserve unrelated servers and data. Record an isolated-port exception explicitly when the intended checkout cannot use the defaults safely.
2. Select the relevant [shared scenarios and M1 case matrix](../../../docs/current/BROWSER_TESTING.md). Reuse `tests/browser/milestone1.mjs`, `tests/helpers/browserEvidence.mjs`, the existing compatibility test and catalog-backed fixture payload. Keep extensions in those normal repository locations. Do not equate Jest, API health, builds, or mocked Storybook screens with live app browser runs.
3. Bind a test-owned tab through the available CUA browser tool and read its current documentation. Use fictional local accounts/disposable data for account cases. Record Guest/account, actual desktop/mobile size and theme. Fixed dark was demonstrated; light and real OAuth remain unavailable/unverified unless the current app supplies them. Missing browser access, fixtures, credentials or dependencies are blocked/skipped with reasons.
4. For changes, capture the relevant behavior before editing and rerun the same cases afterward. Use fresh evidence directories; compare observable results and screenshots without overwriting or accepting changed baselines. Match actual dimensions and fixture/catalog inputs. Read [M1 troubleshooting](references/troubleshooting.md) when an assertion or environment fails; preserve the failed evidence before a bounded correction and rerun.
5. Clean up only this run's fixtures, browser state, viewport overrides and processes. Retain a preview only when needed for Kyle's spot check; record its lifetime and pending cleanup. Report environment, source/runtime revision and fingerprint, cases/subcases actually run, passed/failed/skipped/blocked, evidence locations, cleanup and gaps using the [report contract](../../../docs/current/BROWSER_TESTING.md#report-contract).

Say **ready for Kyle's local verification** only when the applicable automated cases pass. Record **accepted** only after his explicit response to that identified preview. Use Ship only when separately authorized. Reuse unchanged prior evidence rather than rerunning the entire M1 baseline.

The independent module harness was absent in M1. Once a real checked-in harness exists, inspect its entrypoint and add coverage through the shared suite; never claim future harness, external-service identity or host-theme behavior is already tested.

## Efficient execution

Run explicitly selected shared scenarios in one `runMilestone1` call; emit `summarizeBrowserReport(report)` and retain full evidence. Default `capturePolicy: all` preserves captures. Before/after work sets `comparison: true`, rejecting failure-only capture. Optional `capturePolicy: failure` is for behavior-only smoke with no requested visual comparison. Inspect bounded failure evidence rather than dumping successful DOM/screenshots repeatedly. Never silently accept changed baselines.

Scripts handle fixed assertions. A bounded Luna Low executor may run only supplied read-only scenarios with exact target/session/fixture/cleanup constraints and fresh minimal context. Main-agent coverage selection, failure/visual interpretation, Kyle's acceptance and production-write authorization remain separate. Do not spawn a model to wait. Production packaging of the extracted runner remains unverified until an authorized live run.
