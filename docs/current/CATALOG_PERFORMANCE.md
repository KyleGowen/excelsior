# Catalog performance

The Medium batch implements recommendations #5, #6 and #9 from the October 14 production baseline.

## Printing presentation (#5)

`presentCatalog` builds rank, default and printing-picker indexes once per input catalog. Rank groups anchor mapped foil rows to their bases; default and picker groups retain each row's original key. That distinction preserves cross-set promos, orphan foils, missing foils, alternate art, stable rank ties and input ordering. CatalogService supplies its already calculated content version instead of hashing the same presentation inputs again on a cache miss.

The deployed pre-batch implementation is retained as a test-only differential oracle. Unit fixtures cover every category and reordered/partial inputs; integration coverage compares every field of every real catalog printing, then compares compact expansion with the full representation.

## Deck catalog snapshots (#6)

Each DeckValidationService owns one current content snapshot. Every resolve still awaits all thirteen repository reads, preserving existing repository refresh behavior and failure handling. A digest of the complete returned bundle decides whether to reuse the typed lookup. Changed stats, IDs or rows invalidate it on the next read; a rejected read propagates instead of serving an old snapshot. There is no additional TTL or process-local sync-counter shortcut.

The detached snapshot uses the catalog's JSON representation and has frozen nested rows and read-only maps. Its exact existing catalog version hash and normalized preview lookup are calculated once and retained in a WeakMap keyed only by that snapshot. Old snapshots can be collected when requests release them. Mutable independently supplied maps are never memoized. Basic Universe's printed skill type remains separate from its deck category.

Legality, candidate evaluation, hand generation, export and grid summaries share catalog artifacts, while each request still computes its own result from current draft inputs. No player IDs, decks, permissions, evaluations or random hands are cached. Rule order, messages, rule versions and HTTP evaluation contracts remain unchanged.

## Compact transport (#9)

Existing presentation URLs accept the scalar opt-in `compact=1`. The default remains the published full array. The compact response shares versions and exact repeated presentation groups, and retains raw card fields and per-printing metadata. A group definition is inline with its first card and later references point backward. Printing identity is copied from the raw row id. This locality preserves gzip matches; a separated header dictionary was rejected before production because it increased compressed bytes. The real-catalog integration test now guards gzip size as well as lossless expansion. The frontend only expands the transport representation; it does not derive domain rules. Unknown formats or broken group references fail instead of invoking client rule fallbacks.

Both ordinary and forced-fresh catalog reads request the compact representation through their existing host transport. Forced reads keep their AbortSignal and no-store policy. Older hosts can ignore the query and return the full array. QueryClient keys, freshness windows, authorization and native gateway no-store headers are unchanged. Direct catalog edge caching already includes query strings, and payload ETags distinguish representations. No infrastructure change is required.

See [API_V1.md](../../API_V1.md) for wire fields and since-version compatibility, and [the LRG handoff](FRONTEND_PERFORMANCE_LRG_HANDOFF.md) for the frontend port.
