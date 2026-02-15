/**
 * Generate thumbnails for character card images.
 * Scans characters/ and characters/alternate/ for all image formats,
 * outputs resized WebP thumbnails to characters/thumb/.
 * Run with: npm run generate:thumbnails
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif'];
const MAX_WIDTH = 600;
const WEBP_QUALITY = 80;

const CHARACTERS_DIR = path.join(
  process.cwd(),
  'src/resources/cards/images/characters'
);
const THUMB_DIR = path.join(CHARACTERS_DIR, 'thumb');

function getAllImageFiles(dir: string, basePath: string = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    if (entry.isDirectory()) {
      // Skip the thumb output directory
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

function getThumbnailPath(sourcePath: string): string {
  const relativeToChars = path.relative(CHARACTERS_DIR, sourcePath);
  const dir = path.dirname(relativeToChars);
  const basename = path.basename(sourcePath, path.extname(sourcePath));
  const thumbRelative = path.join(dir, `${basename}.webp`);
  return path.join(THUMB_DIR, thumbRelative);
}

function shouldSkip(sourcePath: string, thumbPath: string): boolean {
  if (!fs.existsSync(thumbPath)) return false;
  const sourceStat = fs.statSync(sourcePath);
  const thumbStat = fs.statSync(thumbPath);
  return thumbStat.mtimeMs >= sourceStat.mtimeMs;
}

async function generateThumbnails(): Promise<void> {
  console.log('🖼️  Generating character card thumbnails...');
  console.log('   Source:', CHARACTERS_DIR);
  console.log('   Output:', THUMB_DIR);
  console.log('   Max width:', MAX_WIDTH, 'px, WebP quality:', WEBP_QUALITY);

  const imageFiles = getAllImageFiles(CHARACTERS_DIR);
  console.log(`   Found ${imageFiles.length} image(s) to process\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const sourcePath of imageFiles) {
    const thumbPath = getThumbnailPath(sourcePath);

    if (shouldSkip(sourcePath, thumbPath)) {
      skipped++;
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
      await sharp(sourcePath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(thumbPath);
      processed++;
      console.log(`   ✓ ${path.relative(CHARACTERS_DIR, sourcePath)} → thumb/${path.relative(CHARACTERS_DIR, thumbPath).replace(/^thumb[\\/]/, '')}`);
    } catch (err) {
      errors++;
      console.error(`   ✗ ${path.relative(CHARACTERS_DIR, sourcePath)}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n✅ Done: ${processed} generated, ${skipped} skipped (up to date), ${errors} error(s)`);
}

generateThumbnails().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
