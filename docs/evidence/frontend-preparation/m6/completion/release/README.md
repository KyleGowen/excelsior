# M6 completed release

Kyle approved the final 5185 local preview. Commit ec2af89558dfaf25faf0813944830ff6244f6944 passed candidate validation and all 29 main deployment jobs, then cache-bypassed production health with application/database OK and V365. Actual CI execution is recorded in [verification](verification.json).

All five selected shared live production browser scenarios passed with zero browser errors: Guest Home/menu, Database search/detail/artwork, Guest Collection read, public deck draw/redraw/export, and Supporter retirement. Current public API fixtures independently supplied 51 cards, 76 threat, Black Samson reserve and legal=true; draw/redraw returned eight cards. Empty search and account mutations were excluded. [Browser report](browser-report.json) retains exact cases and evidence. Guest-session route IDs and collection captures stay private.

Production records were unchanged; the public deck metadata/cards matched across smoke. The test-owned tab was closed and viewport reset. Five owned local copies had already been removed after acceptance.

The first candidate failed on source checksums misclassified as secrets. All 15 findings were verified as current source hashes; only the evidence document changed to aggregate provenance and path inventory. The corrected candidate passed the same security gate without disabling rules or adding ignores.

M6 native host integration preparation is shipped. This is not a rebrand or external host launch. Development-only host fixtures remain local; actual host packaging/assets, supported-browser/assistive-technology validation, M7/M8 and retained M4 domain contracts remain future work. Native browser unload-dialog automation is still an explicit gap. Kyle production acceptance is not inferred from automated success.

This post-release evidence and ledger update remain uncommitted to avoid a second deployment for bookkeeping.
