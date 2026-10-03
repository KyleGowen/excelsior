# M1 recovery lessons

Read the failed screenshot/DOM, selected URL, actual viewport, browser errors, sanitized API/Vite logs and target evidence before retrying. Keep the failed artifact; a corrected locator or fixture does not erase the first result.

| Symptom observed in M1 | Successful recovery or limit |
| --- | --- |
| Healthy Home unexpectedly advertises Supporter | Compared checkout/remote histories and served worktree; reconciled shelving on current main while preserving unrelated edits. For a test-only task, report the target mismatch and select the intended prepared checkout; reconciliation requires implementation scope. Never baseline an unintended feature as accepted. |
| After navigation, snapshot still describes the previous page or Loading | Waited for the destination's observed heading/control, then refreshed DOM. Use `waitFor` on the exact visible target, not arbitrary sleeps or an immediate stale snapshot. |
| Collection heading lookup times out | Actual heading was **My Collection**, not Collection. Inspected DOM, corrected locator, reran Owned only/empty checks. Report harness error separately from product failure; do not silently rewrite an assertion to whatever text appears. |
| Screenshot labeled mobile still has desktop dimensions | Closed the unrelated temporary Storybook tab, reapplied viewport to the intended live tab, read `document.documentElement.clientWidth/clientHeight`, then recaptured. Reset override afterward. Some original desktop images are 1200×833; compare actual artifact sizes. |
| Isolated worktree card art missing | M1 used the application's configured public CDN and checked rendered image `complete` and positive natural dimensions. The Storybook asset preparation helper has its own tracked-art fallback. A 200 page or visible image element alone is insufficient. Never download assets or copy the full art tree just to hide a wrong asset base. |
| Development watcher breaks after dependency replacement | Old ts-node-dev process could run until a restart, then could not load its removed module. Current `tsx watch` successfully served health against the same isolated DB. Restart only the known run-owned API with the current maintained command and reverify API plus Vite proxy. |
| Count fixture save fails unexpectedly | An API integration fixture selected a one-per-deck power card. Changed the fixture to an unrestricted printing and reran affected tests; product rules stayed intact. This was API/integration recovery, not browser proof. |
| Fresh disposable database historical V359 setup fails | One bounded clean retry passed the isolated integration setup without source edits. Preserve its log, do not change production migrations, relax checks, or repeatedly rerun blindly. This was integration setup recovery, not a browser assertion pass. |
| Export/import disagrees with editor pre-placement totals | Recorded distinct physical/drawable/export metrics; export did not encode pre-placement and import was non-atomic. Use the compatibility tests and report the discrepancy; do not silently repair it or accept a changed baseline. |
| Browser tool loses usable controls/context | Reloaded CUA documentation and refreshed current page state; rebound the intended tab if stale. If access remains unavailable, report browser checks blocked. Builds/API-only results do not fill that gap. |

Sandbox `EPERM` belongs to startup/access diagnosis; the startup skill permits retrying the same operation with available approval/escalation. No automatic repeated reinstall, permission change, server reset or broad cleanup follows from a test failure. Runtime browser interruptions require the browser tool's own recovery/confirmation policy.

M1 did not demonstrate a pixel-diff tolerance, browser performance waterfall, light theme, real isolated Google OAuth, independent module harness, or production account mutation/cleanup. Keep these gaps explicit.
