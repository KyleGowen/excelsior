import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  PRESET_CHARACTER,
  PRESET_LOCATION,
  PRESET_PORTRAIT,
  PROMO_ART_SUBDIRS,
  SKYP_SUBDIRS,
  THUMB_CONFIGS,
} from '../../src/scripts/generateCardThumbnails';

describe('generateCardThumbnails THUMB_CONFIGS', () => {
  it('uses contain for landscape character thumbs', () => {
    expect(THUMB_CONFIGS.characters).toBe(PRESET_CHARACTER);
    expect(PRESET_CHARACTER.fit).toBe('contain');
    expect(PRESET_CHARACTER.width).toBe(380);
    expect(PRESET_CHARACTER.height).toBe(280);
  });

  it('uses portrait contain preset for special and universe folders', () => {
    const portraitFolders = [
      'specials',
      'power-cards',
      'aspects',
      'advanced-universe',
      'teamwork-universe',
      'ally-universe',
      'training-universe',
      'basic-universe',
      'missions',
    ] as const;

    for (const folder of portraitFolders) {
      expect(THUMB_CONFIGS[folder]).toBe(PRESET_PORTRAIT);
    }

    expect(PRESET_PORTRAIT.fit).toBe('contain');
    expect(PRESET_PORTRAIT.width / PRESET_PORTRAIT.height).toBeCloseTo(5 / 7, 2);
  });

  it('uses contain for landscape location thumbs', () => {
    expect(THUMB_CONFIGS.locations).toBe(PRESET_LOCATION);
    expect(PRESET_LOCATION.fit).toBe('contain');
    expect(PRESET_LOCATION.width / PRESET_LOCATION.height).toBeCloseTo(236 / 151, 2);
  });

  it('keeps generated thumbnails aligned with their configured canvas dimensions', async () => {
    const expectTreeToMatchPreset = async (
      thumbRoot: string,
      preset: { width: number; height: number },
    ) => {
      if (!fs.existsSync(thumbRoot)) return;

      const pending = [thumbRoot];
      while (pending.length > 0) {
        const current = pending.pop()!;
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
          const entryPath = path.join(current, entry.name);
          if (entry.isDirectory()) {
            pending.push(entryPath);
            continue;
          }
          if (!entry.name.endsWith('.webp')) continue;

          const metadata = await sharp(entryPath).metadata();
          expect({ file: path.relative(process.cwd(), entryPath), width: metadata.width, height: metadata.height })
            .toEqual({
              file: path.relative(process.cwd(), entryPath),
              width: preset.width,
              height: preset.height,
            });
        }
      }
    };

    for (const [folder, preset] of Object.entries(THUMB_CONFIGS)) {
      const thumbRoot = path.join(process.cwd(), 'src/resources/cards/images', folder, 'thumb');
      await expectTreeToMatchPreset(thumbRoot, preset);
    }

    for (const { subdir, preset } of PROMO_ART_SUBDIRS) {
      const [setFolder, typeFolder] = subdir.split('/');
      const thumbRoot = path.join(
        process.cwd(),
        'src/resources/cards/images',
        setFolder,
        'thumb',
        typeFolder,
      );
      await expectTreeToMatchPreset(thumbRoot, preset);
    }
  });

  it('uses character preset for skyp/characters and portrait for skyp/power', () => {
    expect(SKYP_SUBDIRS).toHaveLength(2);
    expect(SKYP_SUBDIRS[0]).toEqual({ subdir: 'skyp/characters', preset: PRESET_CHARACTER });
    expect(SKYP_SUBDIRS[1]).toEqual({ subdir: 'skyp/power', preset: PRESET_PORTRAIT });
  });

  it('includes tfacp/power in promo art subdirs with portrait preset', () => {
    const tfacp = PROMO_ART_SUBDIRS.find((entry) => entry.subdir === 'tfacp/power');
    expect(tfacp).toEqual({ subdir: 'tfacp/power', preset: PRESET_PORTRAIT });
  });

  it('includes tfacp/ally in promo art subdirs with portrait preset', () => {
    const tfacpAlly = PROMO_ART_SUBDIRS.find((entry) => entry.subdir === 'tfacp/ally');
    expect(tfacpAlly).toEqual({ subdir: 'tfacp/ally', preset: PRESET_PORTRAIT });
  });

  it('includes tfacp/missions in promo art subdirs with portrait preset', () => {
    const tfacpMissions = PROMO_ART_SUBDIRS.find((entry) => entry.subdir === 'tfacp/missions');
    expect(tfacpMissions).toEqual({ subdir: 'tfacp/missions', preset: PRESET_PORTRAIT });
  });

  it('covers every Skybound set-scoped image directory with the correct orientation', () => {
    const sky = new Map(
      PROMO_ART_SUBDIRS.filter((entry) => entry.subdir.startsWith('sky/'))
        .map((entry) => [entry.subdir, entry.preset]),
    );

    expect(sky.get('sky/characters')).toBe(PRESET_CHARACTER);
    expect(sky.get('sky/locations')).toBe(PRESET_LOCATION);
    expect(sky.get('sky/events')).toBe(PRESET_LOCATION);
    for (const subdir of [
      'sky/specials',
      'sky/power',
      'sky/missions',
      'sky/aspects',
      'sky/advanced-universe',
      'sky/teamwork',
      'sky/ally',
      'sky/training',
      'sky/basic-universe',
      'sky/card-back',
    ]) {
      expect(sky.get(subdir)).toBe(PRESET_PORTRAIT);
    }
  });

  it('covers every ERB set-scoped image directory with the correct orientation', () => {
    const erb = new Map(
      PROMO_ART_SUBDIRS.filter((entry) => entry.subdir.startsWith('erb/'))
        .map((entry) => [entry.subdir, entry.preset]),
    );

    expect(erb.get('erb/characters')).toBe(PRESET_CHARACTER);
    expect(erb.get('erb/locations')).toBe(PRESET_LOCATION);
    expect(erb.get('erb/events')).toBe(PRESET_LOCATION);
    for (const subdir of [
      'erb/specials',
      'erb/power',
      'erb/missions',
      'erb/aspects',
      'erb/advanced-universe',
      'erb/teamwork',
      'erb/ally',
      'erb/training',
      'erb/basic-universe',
    ]) {
      expect(erb.get(subdir)).toBe(PRESET_PORTRAIT);
    }
  });
});
