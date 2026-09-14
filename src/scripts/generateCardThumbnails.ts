/**
 * Generate thumbnails for card images across all card-art directories.
 * Scans each directory for all image formats, outputs resized WebP thumbnails to thumb subdirectories.
 * Run with: npm run generate:thumbnails
 *
 * Excludes non-card assets (e.g. backgrounds/).
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp, { type ResizeOptions } from 'sharp';

const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif'];
const WEBP_QUALITY = 80;

/** When true, every thumbnail is regenerated (ignores mtime skip). Use after changing resize strategy. */
const FORCE_REGENERATE = process.argv.includes('--force');

// Dimensions are 2× the CSS pixel display sizes for retina/HiDPI sharpness.
type ThumbResizeConfig = {
  width: number;
  height: number;
  fit: NonNullable<ResizeOptions['fit']>;
  /** Used with fit 'contain' / 'fill' — letterbox/pad to canvas size */
  background?: ResizeOptions['background'];
};

/** Letterbox pad for `contain` thumbs — matches `--color-bg-elevated` (#0a1220). */
const THUMB_LETTERBOX_BG = { r: 10, g: 18, b: 32, alpha: 1 } as const;

/** Landscape character DB/deck tile (380×280); `contain` matches full-res `object-fit: contain`. */
export const PRESET_CHARACTER: ThumbResizeConfig = {
  width: 380,
  height: 280,
  fit: 'contain',
  background: THUMB_LETTERBOX_BG,
};

/** Portrait DB tile ratio 5:7 at 2× retina; `contain` matches progressive full-res framing. */
export const PRESET_PORTRAIT: ThumbResizeConfig = {
  width: 350,
  height: 490,
  fit: 'contain',
  background: THUMB_LETTERBOX_BG,
};

/** Landscape DB/deck location slot 236×151 (2×); `contain` matches full-res progressive framing. */
export const PRESET_LOCATION: ThumbResizeConfig = {
  width: 472,
  height: 302,
  fit: 'contain',
  background: THUMB_LETTERBOX_BG,
};

/** One entry per top-level folder under src/resources/cards/images (excluding backgrounds, etc.). */
export const THUMB_CONFIGS: Record<string, ThumbResizeConfig> = {
  characters: PRESET_CHARACTER,
  missions: PRESET_PORTRAIT,
  locations: PRESET_LOCATION,
  specials: PRESET_PORTRAIT,
  'power-cards': PRESET_PORTRAIT,
  events: PRESET_LOCATION,
  aspects: PRESET_PORTRAIT,
  'advanced-universe': PRESET_PORTRAIT,
  'teamwork-universe': PRESET_PORTRAIT,
  'ally-universe': PRESET_PORTRAIT,
  'training-universe': PRESET_PORTRAIT,
  'basic-universe': PRESET_PORTRAIT,
};

const THUMBNAIL_DIRS = [
  'characters',
  'missions',
  'locations',
  'specials',
  'power-cards',
  'events',
  'aspects',
  'advanced-universe',
  'teamwork-universe',
  'ally-universe',
  'training-universe',
  'basic-universe',
] as const;

/** Promo set art uses set-scoped folders with mixed aspect ratios. */
export const PROMO_ART_SUBDIRS: { subdir: string; preset: ThumbResizeConfig }[] = [
  { subdir: 'skyp/characters', preset: PRESET_CHARACTER },
  { subdir: 'skyp/power', preset: PRESET_PORTRAIT },
  { subdir: 'tfacp/power', preset: PRESET_PORTRAIT },
  { subdir: 'tfacp/ally', preset: PRESET_PORTRAIT },
  { subdir: 'tfacp/missions', preset: PRESET_PORTRAIT },
  { subdir: 'sky/characters', preset: PRESET_CHARACTER },
  { subdir: 'sky/locations', preset: PRESET_LOCATION },
  { subdir: 'sky/events', preset: PRESET_LOCATION },
  { subdir: 'sky/specials', preset: PRESET_PORTRAIT },
  { subdir: 'sky/power', preset: PRESET_PORTRAIT },
  { subdir: 'sky/missions', preset: PRESET_PORTRAIT },
  { subdir: 'sky/aspects', preset: PRESET_PORTRAIT },
  { subdir: 'sky/advanced-universe', preset: PRESET_PORTRAIT },
  { subdir: 'sky/teamwork', preset: PRESET_PORTRAIT },
  { subdir: 'sky/ally', preset: PRESET_PORTRAIT },
  { subdir: 'sky/training', preset: PRESET_PORTRAIT },
  { subdir: 'sky/basic-universe', preset: PRESET_PORTRAIT },
  { subdir: 'sky/card-back', preset: PRESET_PORTRAIT },
  { subdir: 'erb/characters', preset: PRESET_CHARACTER },
  { subdir: 'erb/locations', preset: PRESET_LOCATION },
  { subdir: 'erb/events', preset: PRESET_LOCATION },
  { subdir: 'erb/specials', preset: PRESET_PORTRAIT },
  { subdir: 'erb/power', preset: PRESET_PORTRAIT },
  { subdir: 'erb/missions', preset: PRESET_PORTRAIT },
  { subdir: 'erb/aspects', preset: PRESET_PORTRAIT },
  { subdir: 'erb/advanced-universe', preset: PRESET_PORTRAIT },
  { subdir: 'erb/teamwork', preset: PRESET_PORTRAIT },
  { subdir: 'erb/ally', preset: PRESET_PORTRAIT },
  { subdir: 'erb/training', preset: PRESET_PORTRAIT },
  { subdir: 'erb/basic-universe', preset: PRESET_PORTRAIT },
];

/** @deprecated Prefer PROMO_ART_SUBDIRS; kept for existing imports/tests. */
export const SKYP_SUBDIRS = PROMO_ART_SUBDIRS.filter((entry) => entry.subdir.startsWith('skyp/'));

const IMAGES_BASE = path.join(process.cwd(), 'src/resources/cards/images');

function getAllImageFiles(dir: string, basePath: string = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'thumb') continue;
      results.push(...getAllImageFiles(fullPath, basePath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function getThumbnailPath(sourcePath: string, sourceDir: string, thumbDir: string): string {
  const relativeToSource = path.relative(sourceDir, sourcePath);
  const dir = path.dirname(relativeToSource);
  const basename = path.basename(sourcePath, path.extname(sourcePath));
  const thumbRelative = path.join(dir, `${basename}.webp`);
  return path.join(thumbDir, thumbRelative);
}

async function shouldSkip(
  sourcePath: string,
  thumbPath: string,
  thumbConfig: ThumbResizeConfig,
): Promise<boolean> {
  if (FORCE_REGENERATE) return false;
  if (!fs.existsSync(thumbPath)) return false;
  const sourceStat = fs.statSync(sourcePath);
  const thumbStat = fs.statSync(thumbPath);
  if (thumbStat.mtimeMs < sourceStat.mtimeMs) return false;

  // A source-mtime check alone misses generator preset changes. Validate the
  // generated canvas so stale thumbnails are rebuilt on the next dev/build run.
  try {
    const metadata = await sharp(thumbPath).metadata();
    return metadata.width === thumbConfig.width && metadata.height === thumbConfig.height;
  } catch {
    return false;
  }
}

async function processDirectory(
  sourceDir: string,
  thumbDir: string,
  label: string,
  thumbConfig: ThumbResizeConfig
): Promise<{ processed: number; skipped: number; errors: number }> {
  const imageFiles = getAllImageFiles(sourceDir);
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const sourcePath of imageFiles) {
    const thumbPath = getThumbnailPath(sourcePath, sourceDir, thumbDir);

    if (await shouldSkip(sourcePath, thumbPath, thumbConfig)) {
      skipped++;
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
      const resizeOpts: ResizeOptions = {
        width: thumbConfig.width,
        height: thumbConfig.height,
        fit: thumbConfig.fit,
        ...(thumbConfig.background ? { background: thumbConfig.background } : {}),
      };
      await sharp(sourcePath)
        .resize(resizeOpts)
        .webp({ quality: WEBP_QUALITY })
        .toFile(thumbPath);
      processed++;
      const rel = path.relative(sourceDir, sourcePath);
      const thumbRel = path.relative(thumbDir, thumbPath);
      console.log(`   ✓ ${rel} → thumb/${thumbRel}`);
    } catch (err) {
      errors++;
      console.error(`   ✗ ${path.relative(sourceDir, sourcePath)}:`, err instanceof Error ? err.message : err);
    }
  }

  return { processed, skipped, errors };
}

async function generateThumbnails(): Promise<void> {
  console.log('🖼️  Generating card thumbnails (all card-art directories; backgrounds excluded)...');
  if (FORCE_REGENERATE) {
    console.log('   --force: regenerating all thumbnails (ignoring skip cache)');
  }
  console.log(
    '   Presets: characters 380×280 contain; portrait 350×490 contain; locations/events 472×302 contain (2× retina) | WebP quality:',
    WEBP_QUALITY
  );
  console.log('');

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const dirName of THUMBNAIL_DIRS) {
    const sourceDir = path.join(IMAGES_BASE, dirName);
    const thumbDir = path.join(sourceDir, 'thumb');

    if (!fs.existsSync(sourceDir)) {
      console.log(`⏭️  Skipping ${dirName}/ (directory not found)`);
      continue;
    }

    const config = THUMB_CONFIGS[dirName];
    console.log(`📁 ${dirName}/  (${config.width}×${config.height}, ${config.fit})`);
    const { processed, skipped, errors } = await processDirectory(sourceDir, thumbDir, dirName, config);
    totalProcessed += processed;
    totalSkipped += skipped;
    totalErrors += errors;
    console.log(`   ${processed} generated, ${skipped} skipped, ${errors} error(s)\n`);
  }

  for (const { subdir, preset } of PROMO_ART_SUBDIRS) {
    const sourceDir = path.join(IMAGES_BASE, subdir);
    const promoRoot = subdir.split('/')[0];
    const thumbDir = path.join(IMAGES_BASE, promoRoot, 'thumb', path.basename(subdir));

    if (!fs.existsSync(sourceDir)) {
      console.log(`⏭️  Skipping ${subdir}/ (directory not found)`);
      continue;
    }

    console.log(`📁 ${subdir}/  (${preset.width}×${preset.height}, ${preset.fit})`);
    const { processed, skipped, errors } = await processDirectory(sourceDir, thumbDir, subdir, preset);
    totalProcessed += processed;
    totalSkipped += skipped;
    totalErrors += errors;
    console.log(`   ${processed} generated, ${skipped} skipped, ${errors} error(s)\n`);
  }

  console.log(`✅ Done: ${totalProcessed} generated, ${totalSkipped} skipped (up to date), ${totalErrors} error(s)`);
}

const isMain = require.main === module || process.argv[1]?.includes('generateCardThumbnails');

if (isMain) {
  generateThumbnails().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
