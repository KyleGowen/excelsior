---
name: generate-card-checklist
description: Generate standalone, personal OverPower collection checklist HTML files with checkbox persistence, local card previews, and The Orange King price pills. Use when Kyle asks for a checklist like the Original OverPower 1995 checklist, or wants the same checklist treatment for another set.
---

# Generate Card Checklist

## Overview

Use this skill to create or refresh a personal checklist page under `data/personal/`. The output is a standalone HTML file, not part of the Excelsior runtime, but it should reuse the Excelsior visual language: dark workbench, compact controls, checklist tiles, metadata pills, sticky image preview, and portable progress JSON.

Pricing must come from `$orange-king-price`. This is deterministic scraping, so use the lowest available tool-capable model tier; escalate only when the source data or price matching is ambiguous.

## Quick Start

For the current Original OverPower checklist:

```bash
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py \
  --preset original-overpower-1995 \
  --with-prices \
  --seed-progress data/personal/original-overpower-1995-checklist-progress.json \
  --output data/personal/original-overpower-1995-checklist.html
```

Use `--no-prices` only for draft layout work. Final user-facing checklist pages should include prices unless Kyle explicitly skips them.

For PowerSurge:

```bash
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py \
  --preset powersurge \
  --with-prices \
  --output data/personal/powersurge-checklist.html
```

For Mission Control:

```bash
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py \
  --preset mission-control \
  --with-prices \
  --output data/personal/mission-control-checklist.html
```

For DC OverPower Batman/Superman:

```bash
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py \
  --preset dc-overpower-batman-superman \
  --with-prices \
  --output data/personal/dc-overpower-batman-superman-checklist.html
```

For IQ OverPower:

```bash
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py \
  --preset iq-overpower \
  --with-prices \
  --output data/personal/iq-overpower-checklist.html
```

## Workflow

1. Confirm the set and source files. Prefer existing local structured data:
   - `docs/checklist-source/` when checklist card numbers or official sheet names matter.
   - `src/resources/legacy/marvelop/mvop-tables/md/` for legacy OverPower table exports with names, types, rarities, and image filenames.
2. Generate into `data/personal/<set-slug>-checklist.html` by default. Keep portable progress beside it as `<set-slug>-checklist-progress.json`.
   - Default sort must be card number.
   - If a local checklist/manifest/order file has numbers, use that.
   - If no printed number source exists, assign stable `#001...` numbers from the configured source-file order and state that in the final note.
3. Price cards through the Orange King skill:
   - For a one-off card, run `.agents/skills/orange-king-price/scripts/orange_king_price.py`.
   - For generated checklists, use this skill's generator with `--with-prices`; it imports and reuses the Orange King scraper code so prices come from the same matching rules.
4. Seed progress with `--seed-progress` when there is an existing JSON state. The page also keeps browser `localStorage`, import/export, and a connected-file mode that writes every checkbox change to portable JSON.
5. If useful for review, copy the generated HTML into the current Codex visualization directory, but keep the source-of-truth file in `data/personal/`.

## Generator

The bundled script supports these presets:

```bash
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py --preset original-overpower-1995
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py --preset powersurge
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py --preset mission-control
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py --preset dc-overpower-batman-superman
python3 .agents/skills/generate-card-checklist/scripts/generate_checklist.py --preset iq-overpower
```

Important options:

- `--output PATH`: output HTML file.
- `--progress-output PATH`: progress JSON filename mentioned by the page and used for first-run creation if missing.
- `--seed-progress PATH`: embed existing checked state into the generated page.
- `--with-prices` / `--no-prices`: include or skip The Orange King price lookups.
- `--price-cache PATH`: reuse a JSON cache so refreshes do not re-query unchanged cards.
- `--image-base-url URL`: override the image path used by the preview panel.

## Checklist Requirements

- Keep the visible row format compact: checkbox, card name, then pills for type, rarity, and price.
- Show a subtle `#001`-style number pill on each row and default the sort control to `Sort: Card number`.
- Style price pills by value so expensive cards pop while bulk stays quiet:
  - `$0.50` and under: dark but still visible.
  - `$0.51` to `$1.99`: lighter grey.
  - `$2.00` to `$4.99`: slightly dark white.
  - `$5.00` to `$9.99`: white.
  - `$10.00` to `$19.99`: Excelsior teal.
  - `$20.00` and up: red.
- Include search, type filter, sort filter, clear visible, export, import, and connect-file controls.
- Include a sticky rollover/focus preview panel with the local scan when images exist.
- Keep card images optional; if no image exists, render the row and show a clear empty-preview state.
- Do not guess missing prices. Mark them as `No TOK price`.
- Do not include shipping, tax, discounts, cart behavior, sold listings, or eBay prices.

## Adding Another Set

Add a new preset in `scripts/generate_checklist.py` with:

- source markdown files,
- image directory or image base URL,
- output/progress defaults,
- type ordering,
- optional files to exclude,
- and any set-specific card-name cleanup needed before pricing.

When a different The Orange King collection is needed, extend `$orange-king-price` first or pass through its existing search lookup. Keep the price source unified so checklist pages and single-card lookups agree.
