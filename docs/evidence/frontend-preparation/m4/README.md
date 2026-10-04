# M4 first slice and navigation freshness

This is local evidence for the first catalog slice and Kyle’s Database → Deck navigation bug. It does not complete M4 or prove deployment. See [verification.json](verification.json) and [cleanup.json](cleanup.json).

The real browser flow warms the deck query, navigates to Database, adds a previously absent card, then clicks Decks and its deck tile. The final screenshot shows the new card and updated total without any reload after the addition. The same shared Database cases ran before and after catalog changes; screenshot differences are retained and not accepted as replacement baselines. API parity, Jest and Storybook remain distinct from live browser proof.

`target-after.json` identifies the base commit and uncommitted source fingerprint at the final run; copying evidence and updating the ledger subsequently changes the whole-tree fingerprint without changing tested application code. The earlier navigation-after replay’s target fingerprint is superseded by navigation-final. Reports retain their original run evidence paths; the corresponding files are archived here. Cleanup was confirmed afterward in cleanup.json, resolving the per-run pending cleanup fields.

The fictional fixture originally contained three copies of a one-per-deck special, which made the add validator reject unrelated additions. Only this disposable fixture was normalized to one special for testing. Its original character1/special3/power5 rows are restored and the added card is removed. Production was untouched.
