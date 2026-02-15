# Unused Code Cleanup Report

## Summary

| Metric | Value |
|--------|-------|
| Files removed | 42 |
| Code files removed (*.ts, *.js) | 28 |
| Lines of code removed | 15,840 |
| Project code total (before cleanup) | 190,706 lines |
| Project code total (after cleanup) | 174,866 lines |
| Removed as % of project | 8.3% |

## Files Removed by Category

### Backup files (8 files)
- `src/index.ts.backup` (239 lines)
- `public/index.html.backup` (16,514 lines)
- `public/index.html.backup-cleanup` (18,010 lines)
- `public/js/data-loading.js.bak` (145 lines)
- `public/js/layout-drag-drop-functions.js.bak` (560 lines)
- `public/js/card-display-functions.js.bak` (1,042 lines)
- `public/js/card-display.js.bak` (1,574 lines)
- `public/js/deck-editor-core.js.bak` (648 lines)

### Orphaned database view modules (8 files, 3,343 lines)
- `public/js/database-view.js`
- `public/js/database-view-core.js`
- `public/js/database-view-tabs.js`
- `public/js/database-view-search.js`
- `public/js/database-view-display.js`
- `public/js/filter-utilities.js`
- `public/js/filter-manager.js`
- `public/js/data-loading-core.js`

### Duplicate src/public directory (20 files)
- 14 JavaScript files (10,342 lines)
- `index.html`, `card-tables.css`, 4 style files

### Orphaned unit tests (6 files, 2,155 lines)
- `tests/unit/database-view-core.test.ts`
- `tests/unit/database-view-tabs.test.ts`
- `tests/unit/filter-utilities.test.ts`
- `tests/unit/database-view-js.test.ts`
- `tests/unit/database-view-js-comprehensive.test.ts`
- `tests/unit/database-view-loading.test.ts`

## Additional Changes

- **Security code (removed earlier)**: SecurityService.ts, securityMiddleware.ts, and their tests
- **Scripts reorganized**: One-off fix scripts moved to `scripts/archive/`, data maintenance scripts to `scripts/data-maintenance/`

## Code Files Scope

For the percent calculation, only `*.ts` and `*.js` files in `src/`, `public/`, `scripts/`, `tests/`, and `infra/` were counted, excluding `node_modules/`, `dist/`, and `coverage/`.
