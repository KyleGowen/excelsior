# Publication validation

The browser skills and hygiene items 1–5 were isolated from the dirty primary checkout onto current main `68c7a46980b4894172c445f28526b2a3a841878e`. Newer validation-first release instructions, filesystem integration discovery, JSON results and legacy report-directory support were preserved. Application code, dependency manifests, migrations, CI workflows and unrelated edits are outside this commit.

Local checks on the reconciled contents:

| Check | Result |
| --- | --- |
| Backend and changed TypeScript lint | Passed |
| Full unit gate | 3,729 passed; 18 skipped; 320 suites passed, 2 skipped |
| Two isolated integration shards | 1,003 passed across all 112 discovered suites |
| Node browser/workflow guards | 16 passed |
| Python startup guards | 5 passed |
| Dependency audit | Zero vulnerabilities |
| Skill Creator validator | All five revised skills passed |
| Whitespace and frozen scope checks | Passed |

The initial fresh-database setup failed in the existing V359 catalog assertion; one bounded retry completed migrations and all integration tests. Both attempts cleaned up their disposable containers. The synthetic runner fixture was adapted to the newer filesystem-discovery contract, including omitted-file rejection and JSON retention. Its timeout fixture now permits Node startup under concurrent local checks while still proving one timed-out request and no retry.

The earlier [implementation validation](validation.md) and [browser skill validation](../browser-skills-validation/validation.md) remain historical evidence. No full browser baseline or production browser tests were repeated for publication. Kyle explicitly authorized main promotion and took responsibility for CI monitoring on this push; this record does not claim CI success, deployment success or production validation. Milestone 2 remains paused.
