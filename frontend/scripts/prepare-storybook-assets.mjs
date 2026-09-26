import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep the standalone gallery small: the complete card-art tree is over 2 GB.
// These paths are real repository assets used by the example stories.
const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(frontendRoot, '..');
const outputRoot = resolve(frontendRoot, '.storybook/static');

const assets = [
  'src/resources/images/logo/logo5.png',
  'src/resources/images/logo/logo6.png',
  'src/resources/images/login/login-bg.png',
  'src/resources/images/home/banners/skybound-immortal.png',
  'src/resources/images/home/banners/skybound-immortal-2x.png',
  'src/resources/images/icons',
  'src/resources/cards/images/placeholder.webp',
  'src/resources/cards/images/characters/billy_the_kid.webp',
  'src/resources/cards/images/characters/thumb/billy_the_kid.webp',
  'src/resources/cards/images/characters/sherlock_holmes.webp',
  'src/resources/cards/images/characters/thumb/sherlock_holmes.webp',
  'src/resources/cards/images/characters/joan_of_arc.webp',
  'src/resources/cards/images/characters/thumb/joan_of_arc.webp',
  'src/resources/cards/images/characters/victory_harben.webp',
  'src/resources/cards/images/characters/thumb/victory_harben.webp',
  'src/resources/cards/images/events/heroes_we_need.webp',
  'src/resources/cards/images/events/thumb/heroes_we_need.webp',
  'src/resources/cards/images/aspects/mallku.webp',
  'src/resources/cards/images/aspects/thumb/mallku.webp',
];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(
  resolve(frontendRoot, 'node_modules/msw/lib/mockServiceWorker.js'),
  resolve(outputRoot, 'mockServiceWorker.js'),
);
for (const asset of assets) {
  const destination = resolve(outputRoot, asset);
  await mkdir(dirname(destination), { recursive: true });
  try {
    await cp(resolve(repositoryRoot, asset), destination, { recursive: true });
  } catch (error) {
    // Card thumbnails are generated locally and are absent from a fresh clone.
    // Use the tracked full-size image for these few Storybook examples.
    if (error?.code !== 'ENOENT' || !asset.includes('/thumb/')) throw error;
    await cp(resolve(repositoryRoot, asset.replace('/thumb/', '/')), destination);
  }
}
