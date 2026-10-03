# Verification receipts and bounded execution

## Approved gate batch

The main agent selects coverage. Write a private plan outside the checkout with explicit argument arrays and no secrets or shell interpolation:

```json
{"gates":[
  {"name":"lint","kind":"check","command":["npx","eslint","src","--ext",".ts","--max-warnings","0"]},
  {"name":"unit","kind":"test-gate","command":["bash","scripts/ship-conditional-test.sh","unit"]}
]}
```

Add integration/SOC2/audit/frontend checks only when required. Run `node scripts/run-verification-gates.mjs --plan <private-plan.json> --report-dir <fresh-private-directory>`. `--dry-run` executes nothing and never counts as pass. The wrapper selects no coverage and authorizes no commands. Independent gates run together with deadlines, full private logs and one compact result. `kind: jest` requires actual Jest summary counts; `test-gate` requires the conditional runner's receipt; `check` records command outcome without claiming tests/browser coverage. Read failed logs narrowly; avoid repeated full-success output. Reports belong outside source or in ignored directories.

## Test cache contract

The conditional runner stores separate atomic versioned receipts for unit/integration. Legacy hashes are ignored. `SHIP_TESTS_FORCE=1` bypasses reuse but still checks pre/post inputs and test counts.

`scripts/ship-test-inputs.mjs` hashes content/modes independently of HEAD/staging, Node version, installed dependency lock receipts, dotenv files and inherited environment (digests only). Integration also binds Docker version and local fixture image IDs. Source/tests/configuration/locks/migrations/data/assets/scripts and unknown files remain inputs. Only explicitly reviewed skill prose/metadata, named report guides and narrow report directories are excluded; Markdown/docs are not blanket exclusions. Do not broaden exclusions without inspecting loaders/fixtures and adding regression coverage. Changed inputs during any execution fail validation. Missing dependency/runtime identity disables reuse. Zero/unavailable actual test execution counts fail. Receipts expire after 24 hours and require retained logs.

Cache hits report `reused`, zero newly executed tests and original evidence. Never relabel reuse as fresh execution. Integration retains exact nonoverlapping discovery and separate disposable DBs/ports/Jest caches/persistence, logs and cleanup status. Never share a DB between concurrent Jest processes. Retain the documented bounded retry for isolated migration setup; do not repeatedly rerun blindly.

## Monitoring without a model waiter

Run the exact-SHA watcher once through `exec_command`, yielding a process session. Within one tool orchestration invocation, await bounded `write_stdin` reads at 60 seconds, emit concise progress via `notify` and return terminal/error evidence. Do not run one-second main-model reads. If the host yields orchestration cells, resume with bounded waits; host-required wake-ups can still use a model. No model-bearing waiter or recurring automation is needed.

```javascript
while (sessionId) {
  const next = await tools.write_stdin({session_id: sessionId, yield_time_ms: 60000, max_output_tokens: 1500});
  notify(next.output || 'Release checks still running; no new Actions state.');
  sessionId = next.session_id;
  if (!sessionId) text({exitCode: next.exit_code, receipt: actionsReceiptPath});
}
```

Adapt this recipe to the available tool contract, preserve session ownership/user interruption, and never block an individual read over 60 seconds. Default watcher limits are 30-second requests, 20-minute unchanged state and 2-hour total wait. Polling is at least 60 seconds, output changes only, SHA checked every response, and the first GitHub error stops. `--terminal-only` is for hosts supplying periodic scripted status. Timeout/stall needs main-agent review, not automatic recovery. Offline `--replay <JSON-state-array> --poll-seconds 0` never invokes GitHub and cannot prove a live deployment.

## Evidence and measurement

`kind: node-test` in a gate plan verifies Node's TAP totals and rejects empty/cancelled execution. Cache evidence also binds the retained log digest. A first run may acquire previously absent fixture images: code/dependency/environment inputs and already-known runtime identities must stay unchanged; that run is not cached. This avoids repeating a valid suite merely because setup downloaded its first image.

Receipts retain environment, source/intended/deployed revisions, input identity, selected/executed/reused counts and outcomes, elapsed time, evidence, cleanup and gaps. Full reports hold detail; console output carries counts/paths. `browser-test-target.mjs --report <file>` records sanitized health; dry-run is never verified. Browser `summarizeBrowserReport` returns compact results while retaining full artifacts.

Compare main-model turns, empty reads, cached/uncached inputs and output over explicitly defined phases. Keep these separate from local test/GitHub wall time; raw token totals do not establish weekly credit savings. A bounded Luna Low extractor may read only specified nonprivate fields; do not copy raw prompts, credentials, private images or environment dumps. Scope, coverage, security, recovery, visual acceptance, production writes and Kyle's acceptance stay with the main agent/Kyle.
