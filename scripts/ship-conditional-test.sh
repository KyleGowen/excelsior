#!/usr/bin/env bash
# Content-based, environment-bound receipts; legacy hash-only entries are ignored.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$ROOT/scripts/ship-test-gate.mjs" "$@"
