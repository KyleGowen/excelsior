# Image Pipeline — Card Thumbnails

> **Scope:** Build-time thumbnail generation (`npm run generate:thumbnails`), folder layout, and dev vs. production S3 sync. For runtime CDN/CloudFront architecture, see [`CLOUDFRONT_CDN.md`](CLOUDFRONT_CDN.md). For the two-layer progressive-load pattern in the deck editor, see [`PROGRESSIVE_IMAGE_LOADING.md`](PROGRESSIVE_IMAGE_LOADING.md).

## Overview

Card images on deck tiles are served as WebP thumbnails sized to exactly match the CSS display dimensions. Generating at display size reduces bytes transferred per tile by ~60% compared to serving full-resolution images.

The pipeline is handled by `src/scripts/generateCardThumbnails.ts` and runs automatically during `npm run dev` and `npm run build`.

---

## Directory Structure

```
src/resources/cards/images/
├── characters/
│   ├── <character-name>.webp       ← source image (full resolution)
│   ├── alternate/
│   │   └── <character-name>-alt.webp
│   └── thumb/                      ← generated thumbnails (do not edit)
│       ├── <character-name>.webp
│       └── alternate/
│           └── <character-name>-alt.webp
├── locations/
│   ├── <location-name>.webp
│   └── thumb/
│       └── <location-name>.webp
├── missions/
│   ├── <mission-name>.webp
│   └── thumb/
│       └── <mission-name>.webp
├── specials/, power-cards/, events/, aspects/
├── advanced-universe/, teamwork-universe/, ally-universe/, training-universe/, basic-universe/
│   └── thumb/                      ← same pattern under each (mirrors source subdirs)
├── skyp/                           ← Skybound - Promos (set-scoped art paths)
│   ├── characters/                 ← landscape character promos (e.g. Rex Splode)
│   ├── power/                      ← portrait power promos (e.g. 7 - Any-Power)
│   └── thumb/                      ← generated; mirrors characters/ and power/ subdirs
│       ├── characters/
│       └── power/
├── sky/                            ← Skybound full set (additive set-scoped layout)
│   ├── characters/, locations/, events/
│   ├── specials/, power/, missions/, aspects/
│   ├── advanced-universe/, teamwork/, ally/, training/, basic-universe/
│   ├── card-back/                  ← retained Skybound card-back source
│   └── thumb/                      ← generated; mirrors all folders above
├── erb/                            ← ERB World Legends LRG replacement art
│   ├── characters/, locations/, events/
│   ├── specials/, power/, missions/, aspects/
│   ├── advanced-universe/, teamwork/, ally/, training/, basic-universe/
│   └── thumb/                      ← generated; mirrors all folders above
└── tfacp/                          ← The Few and the Cursed - Promos
    ├── ally/                       ← portrait ally promos (e.g. White Demon Of Mazandaran)
    ├── missions/                   ← portrait mission promos (e.g. Chronicles of TFAC)
    ├── power/                      ← portrait power promos (e.g. 7 - Combat)
    └── thumb/
        ├── ally/
        ├── missions/
        └── power/
```

The same generator also fills `thumb/` under every **card-art** top-level folder (excluding `backgrounds/`). **Set-scoped folders** (`sky/`, `erb/`, `skyp/`, `tfacp/`) are handled via `PROMO_ART_SUBDIRS` in `generateCardThumbnails.ts`: e.g. `sky/characters/`, `erb/characters/`, and `skyp/characters/` → character preset; `sky/locations/` and `erb/locations/` → location preset; all portrait types → portrait preset; `sky/events/` and `erb/events/` → event preset. Generated paths insert `thumb/` after the set folder, such as `erb/thumb/characters/001_angry_mob_middle_ages.webp`. Nested source folders are preserved. The `thumb/` directories are auto-generated. Never edit files inside `thumb/` directly — they will be overwritten on the next run.

---

## Thumbnail Dimensions

Dimensions match the exact CSS pixel sizes used on deck tiles. Changing either requires updating both.

| Preset (in `THUMB_CONFIGS`) | 2× source (Sharp) | Fit | Typical use |
|----------------------------|-------------------|-----|-------------|
| Character (`contain`)      | 380×280           | `contain` | characters (landscape DB/deck tiles) |
| Portrait (`contain`)       | 350×490 (5:7)     | `contain` | specials, power-cards, aspects, missions, universe folders |
| Landscape location/event (`contain`) | 472×302 | `contain` | locations, events |

Portrait and character presets letterbox with `#0a1220` pad so progressive DB tiles match full-res `object-fit: contain` framing.

Deck tile CSS still targets characters / locations / missions in `public/css/deck-selection.css`.

To change dimensions, update `THUMB_CONFIGS` in `src/scripts/generateCardThumbnails.ts` **and** any CSS that assumes a fixed thumb aspect ratio.

### Resize fit (`cover` vs `contain`)

- **Characters**: thumbnails use Sharp **`contain`** on 380×280 (matches DB grid full-res framing).
- **Portrait card types** (specials, power, aspects, missions, universe): **`contain`** on 350×490 (5:7).
- **Locations and events**: thumbnails use Sharp **`contain`** at 472×302 (2× the database tile slot `236×151`) so progressive tiles match full-res framing.

After changing fit or padding behavior without changing dimensions, regenerate thumbs with
`npm run generate:thumbnails -- --force`. Dimension changes are detected automatically.

---

## Adding New Card Images

1. Drop the source image into the correct type directory:
   - `src/resources/cards/images/characters/` for characters
   - `src/resources/cards/images/locations/` for locations
   - `src/resources/cards/images/missions/` for missions
   - `src/resources/cards/images/skyp/characters/` or `skyp/power/` for Skybound promo art (DB `image_path` uses the same `skyp/...` prefix)
   - `src/resources/cards/images/sky/<type>/` for the full Skybound set (DB `image_path` uses the same `sky/...` prefix)
   - `src/resources/cards/images/erb/<type>/` for ERB World Legends LRG replacement art (DB `image_path` uses the same `erb/...` prefix)
   - `src/resources/cards/images/tfacp/power/` for TFCP promo power art (DB `image_path` uses `tfacp/power/...`)
   - `src/resources/cards/images/tfacp/ally/` for TFCP promo ally art (DB `image_path` uses `tfacp/ally/...`)
   - `src/resources/cards/images/tfacp/missions/` for TFCP promo mission art (DB `image_path` uses `tfacp/missions/...`)
2. Run `npm run generate:thumbnails`
3. Confirm the new thumbnail appears in the corresponding `thumb/` subdirectory
4. Commit both the source image and the generated thumbnail

**Never commit a source image without its corresponding thumbnail.**

Skybound `F`-suffixed workbook images are printing-production files and remain outside the
public image tree. Foil database rows reuse the matching non-foil `image_path`; the established
frontend sheen supplies the visual treatment. Released alternate-art collectors 419–472 use
their original non-foil sources under `sky/characters/`; collector 450 publishes both front and
reverse faces. The source filename's `F` marker is authoritative even when the workbook's
collector-number cell omits it; the complete source-derived character map has 53 foils, including
alternate Angstrom Levy `#430F`. Collectors `#448` and `#450` have no foil source file.

ERB replacement art is audited in `scripts/erb/lrg-erb-manifest.json`. The LRG folder supplies
534 usable card fronts: collectors `001`–`535` except `205`. Collector `205` (`Read the Bones`)
therefore keeps its pre-existing image. Mission backs and obvious Drive copy duplicates are not
published. Foil database rows reuse the matching LRG front and retain the existing application
sheen. The import uses new `erb/...` paths so existing long-lived CDN objects are not overwritten.

---

## shouldSkip Logic

The script uses file modification times plus the configured output canvas to avoid
regenerating up-to-date thumbnails:

```typescript
async function shouldSkip(sourcePath: string, thumbPath: string, preset: ThumbResizeConfig): Promise<boolean> {
  if (!fs.existsSync(thumbPath)) return false;       // no thumb yet → generate
  const sourceStat = fs.statSync(sourcePath);
  const thumbStat  = fs.statSync(thumbPath);
  if (thumbStat.mtimeMs < sourceStat.mtimeMs) return false;
  const metadata = await sharp(thumbPath).metadata();
  return metadata.width === preset.width && metadata.height === preset.height;
}
```

- If the thumbnail does not exist → generate it
- If the source image is newer than the thumbnail → regenerate it
- If the generated canvas no longer matches the configured preset → regenerate it
- Otherwise → skip (already up to date)

This makes dimension changes self-healing on the next dev/build run while keeping subsequent
runs fast. A fit-only change that retains the same canvas dimensions still requires `--force`.

---

## Build Pipeline Integration

Thumbnail generation is wired into both the dev and build scripts in `package.json`:

```json
"dev":   "npm run generate:thumbnails && ts-node-dev ...",
"build": "npm run generate:thumbnails && tsc"
```

This means thumbnails are always fresh when:
- Starting the dev server (`npm run dev`)
- Building locally (`npm run build`)
- CI `build` job (calls `npm run build`)
- CI `integration-tests` job (calls `npm run build`)
- CI `build-docker` job (has an explicit `generate:thumbnails` step — redundant but harmless, `shouldSkip` makes it instant)

---

## Running Manually

```bash
npm run generate:thumbnails
```

Output example:
```
🖼️  Generating card thumbnails (all card-art directories; backgrounds excluded)...
   Presets: characters 380×280 contain; portrait 350×490 contain; locations/events 472×302 contain (2× retina) | WebP quality: 80

📁 characters/  (380×280, cover)
   ✓ spider-man.webp → thumb/spider-man.webp
   5 generated, 105 skipped, 0 error(s)

📁 specials/  (380×280, cover)
   0 generated, 274 skipped, 0 error(s)

✅ Done: … generated, … skipped (up to date), 0 error(s)
```

---

## UI Icon Size Budget

Repeated UI chrome icons under `src/resources/images/icons/` are intentionally
small source PNGs. They render at 18-32px in most views and up to roughly 50px
inside mobile filter controls, so the root stat/threat icons are capped at a
128px maximum edge and 60 KiB per file. The budget is enforced by
`tests/unit/image-asset-budgets.test.ts`.

If a root icon needs to change, resize it with a 128px max edge and preserve
transparent PNG output unless the consuming code is updated to reference a new
format. Function icons under `src/resources/images/icons/function/` are already
small and keep their native dimensions.

---

## Deck editor card view

The deck editor’s **card view** (cards in the deck with “Change Art”, etc.) uses **thumbnail-first + progressive full-res** for all card types that have `thumb/` assets (via `thumbImageSubdirForCardType` + `toThumbnailPathForType`) so the panel fills quickly instead of waiting on full-resolution images.

- **Initial load**: For any card type mapped by `thumbImageSubdirForCardType`, the visible `<img>` `src` is set to the thumbnail URL (via `toThumbnailPath` / `toThumbnailPathForType`). The helpers support both local site-relative paths and production CDN-prefixed paths.
- **Progressive load (two-layer, no flash)**: After the card-view HTML is in the DOM, `initDeckEditorCardViewProgressiveLoad()` in `public/js/deck-editor-rendering.js` finds each `.card-view-image-full[data-full-res]`. It preloads the full-res image, then sets that layer’s `src` and adds `card-view-image-full--loaded` so the full-res fades in over the thumbnail. The thumbnail layer’s `src` is never changed. Same two-layer fade pattern is used in the card hover modal.
- **Helpers**: `getDeckEditorCardViewInitialImagePath(fullResPath, cardType)` returns the thumbnail URL for char/loc/mission, or the full-res path for other types.
- **Aspect alignment**: Card view uses **type-specific** dimensions for character, location, and event so the display box matches the same aspect ratio as the thumb config and deck selection (see Thumbnail Dimensions table). That way thumb and full-res use the same crop box and there is no visible sizing shift when full-res loads.

Deck selection uses thumbnails (and in production, CDN) for list tiles. The deck editor uses thumbnails + progressive full-res loading; the hover modal uses the same progressive pattern (thumbnail first, then full-res when loaded) where thumbnail assets exist. The hover modal's full-res layer uses `object-fit: cover` (and `object-position: center top`) so it fully covers the thumbnail and the low-res image is never visible behind it.
