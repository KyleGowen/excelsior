# Dead Code Policy

This document defines conventions for identifying, handling, and removing unused code in the Overpower Deckbuilder project.

## When to Remove vs. Archive

### Remove (Delete)
- Orphaned files never imported or loaded (e.g. refactored modules that were never integrated)
- Backup files (`.backup`, `.bak`) after confirming they are obsolete
- Duplicate directories (e.g. `src/public/` when `public/` is the canonical location)
- Code that has been commented out indefinitely with no plan to re-enable
- Unit tests for code that has been removed

### Archive (Move to scripts/archive/)
- One-off fix scripts that may have historical value
- Scripts that were used for production debugging or migrations
- Prefer archive over delete when there is uncertainty about future need

## How to Run Knip

Knip scans for unused exports, unused files, unused dependencies, and other dead code.

```bash
# Run full analysis (includes dev deps, tests)
npm run find:unused

# Run in production mode (excludes dev deps; use in CI)
npx knip --production
```

The `--production` flag focuses on production code and fails on critical unused exports. Use this in CI/CD to block merges when dead code is introduced.

## Conventions

1. **Before removing**: Verify the file is truly unused (grep for imports, check HTML script tags for frontend JS)
2. **Frontend JS**: Files in `public/js/` are loaded via `<script src="">` in HTML. See [docs/FRONTEND_SCRIPT_MANIFEST.md](docs/FRONTEND_SCRIPT_MANIFEST.md) for which files are active
3. **After removal**: Run `npm run test:unit` and fix or remove any broken tests
4. **Knip config**: `knip.json` excludes `public/`, `scripts/`, and test files from "unused files" reporting (vanilla JS and scripts have different entry points)

## CI Integration

The GitHub Actions pipeline runs `npm run find:unused` as a required step. Configure the workflow to use `npx knip --production` for production-focused analysis that fails on critical findings.
