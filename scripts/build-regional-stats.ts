#!/usr/bin/env ts-node
/**
 * Build static tournament stats JSON from the 2026 results workbook.
 *
 * Usage:
 *   npx ts-node scripts/build-regional-stats.ts [path-to-xlsx]
 *   npx ts-node scripts/build-regional-stats.ts --skip-validation
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import 'dotenv/config';
import { DataSourceConfig } from '../src/config/DataSourceConfig';
import {
  aggregateRegionalStats,
  aggregateSeasonCharacterPerformance,
  parse2026DeckSectionRows,
  parseS0SheetRows,
} from './lib/regional-stats/aggregateRegionalStats';
import { normalizeTournamentName } from './lib/regional-stats/nameAliases';
import { readXlsxSheetRows } from './lib/regional-stats/readXlsxSheet';
import type { TournamentEventStats } from './lib/regional-stats/types';

const DEFAULT_XLSX = path.join(
  os.homedir(),
  'Desktop',
  'OP Modern 2026 Results.xlsx',
);

const LEGACY_XLSX = path.join(os.homedir(), 'Desktop', 'OverPower Regionals Character Lists.xlsx');
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'src', 'data', 'tournaments');

const PRIOR_SHEETS = ['S0 Seattle', 'S0 Columbus', 'S0 Toronto', 'S0 Philly', 'S0 Nats'];

const EVENTS = [
  {
    sectionName: 'Columbus',
    outputName: 's1-columbus.json',
    meta: {
      id: 's1-columbus',
      title: 'Columbus Regional',
      subtitle: 'Season One Regional',
      date: '2026-06-27',
      seasonLabel: '1st Season One Regional',
      location: { venueName: 'Heroes and Games', city: 'Columbus', region: 'OH' },
    },
  },
  {
    sectionName: 'Niagara',
    outputName: 's1-niagara.json',
    meta: {
      id: 's1-niagara',
      title: 'Niagara Regional',
      subtitle: 'Season One Regional',
      date: '2026-08-01',
      seasonLabel: '2nd Season One Regional',
      location: {
        venueName: 'Mecha Games',
        city: 'St. Catharines',
        region: 'ON',
        country: 'Canada',
        mapUrl: 'https://maps.google.com/?q=370+Ontario+Street+St+Catharines',
      },
    },
  },
  {
    sectionName: 'Seattle',
    outputName: 's1-seattle-regional.json',
    meta: {
      id: 's1-seattle-regional',
      title: 'Seattle Regional',
      subtitle: 'Seattle Weekend',
      date: '2026-09-05',
      seasonLabel: 'Season One Regional',
      location: { city: 'Seattle', region: 'WA' },
    },
  },
  {
    sectionName: 'Seattle NAOL',
    outputName: 's1-seattle-naol.json',
    meta: {
      id: 's1-seattle-naol',
      title: 'Seattle NAOL',
      subtitle: 'Seattle Weekend',
      date: '2026-09-06',
      seasonLabel: 'Season One NAOL',
      location: { city: 'Seattle', region: 'WA' },
    },
  },
] as const;

function collectReferencedNames(stats: TournamentEventStats): Map<string, string> {
  const names = new Map<string, string>();
  const add = (name: string, catalogType: string) => {
    const canonical = normalizeTournamentName(name);
    if (canonical) names.set(`${catalogType}:${canonical}`, catalogType);
  };

  const allEntries = [
    ...stats.characterAppearances,
    ...stats.top8CharacterAppearances,
    ...stats.newWinningCharacters,
    ...stats.newTop8Characters,
    ...stats.topReserves,
    ...stats.topHomebases,
    ...stats.topCataclysms,
  ];
  for (const e of allEntries) add(e.name, e.catalogType);
  if (stats.mostPlaysWithoutTop8) {
    add(stats.mostPlaysWithoutTop8.name, stats.mostPlaysWithoutTop8.catalogType);
  }
  if (stats.highestTop8Rate) {
    add(stats.highestTop8Rate.name, stats.highestTop8Rate.catalogType);
  }
  for (const deck of stats.deckRows) {
    for (const character of [deck.frontLine1, deck.frontLine2, deck.frontLine3, deck.reserve]) {
      add(character, 'characters');
    }
    if (deck.homebase !== 'Unreported') add(deck.homebase, 'locations');
    if (deck.cataclysm && deck.cataclysm !== 'Unreported' && deck.cataclysm !== 'None') {
      add(deck.cataclysm, 'special-cards');
    }
  }
  return names;
}

async function validateAgainstCatalog(events: TournamentEventStats[]): Promise<void> {
  const referenced = new Map<string, string>();
  for (const stats of events) {
    for (const [key, catalogType] of collectReferencedNames(stats)) {
      referenced.set(key, catalogType);
    }
  }
  const dataSource = DataSourceConfig.getInstance();
  const cardRepo = dataSource.getCardRepository();
  const loadCatalog = async <T>(label: string, read: () => Promise<T>): Promise<T> => {
    try {
      return await read();
    } catch (error) {
      const detail = error instanceof Error ? error.message || error.name : String(error);
      throw new Error(`${label} catalog lookup failed: ${detail}`);
    }
  };

  try {
    const [characters, locations, specials] = await Promise.all([
      loadCatalog('Character', () => cardRepo.getAllCharacters()),
      loadCatalog('Location', () => cardRepo.getAllLocations()),
      loadCatalog('Special card', () => cardRepo.getAllSpecialCards()),
    ]);

    const charNames = new Set(characters.map((c) => c.name.trim()));
    const locNames = new Set(locations.map((l) => l.name.trim()));
    const cataclysmNames = new Set(
      specials.filter((s) => s.is_cataclysm).map((s) => s.name.trim()),
    );

    const missing: string[] = [];
    for (const [key, catalogType] of referenced) {
      const name = key.slice(key.indexOf(':') + 1);
      if (catalogType === 'characters' && !charNames.has(name)) missing.push(`character: ${name}`);
      if (catalogType === 'locations' && !locNames.has(name)) missing.push(`location: ${name}`);
      if (catalogType === 'special-cards' && !cataclysmNames.has(name)) {
        missing.push(`cataclysm: ${name}`);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Unresolved catalog names:\n  ${missing.join('\n  ')}`);
    }
    console.log(`Validated ${referenced.size} unique card references against catalog.`);
  } finally {
    await dataSource.close();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--skip-validation');
  const skipValidation = process.argv.includes('--skip-validation');
  const xlsxPath = path.resolve(args[0] ?? DEFAULT_XLSX);

  if (!fs.existsSync(xlsxPath)) {
    console.error(`Excel file not found: ${xlsxPath}`);
    process.exit(1);
  }

  const rows = readXlsxSheetRows(xlsxPath, '2026 Decks');
  const priorEventDecks = fs.existsSync(LEGACY_XLSX)
    ? PRIOR_SHEETS.map((sheetName) => parseS0SheetRows(readXlsxSheetRows(LEGACY_XLSX, sheetName)))
    : [];
  const seasonEvents = EVENTS.map((event) => parse2026DeckSectionRows(rows, event.sectionName));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const generatedEvents = EVENTS.map((event, index) => {
    const decks = seasonEvents[index];
    const winner = decks.find((deck) => deck.rank === 1);
    const stats = aggregateRegionalStats({
      meta: {
        ...event.meta,
        playerCount: decks.length,
        winnerName: winner?.player ?? 'Unknown',
      },
      decks,
      priorEventDecks: [...priorEventDecks, ...seasonEvents.slice(0, index)],
    });

    return { event, decks, stats };
  });

  if (!skipValidation) {
    try {
      await validateAgainstCatalog(generatedEvents.map(({ stats }) => stats));
    } catch (err) {
      console.warn('Catalog validation failed (writing JSON anyway):', err instanceof Error ? err.message : err);
    }
  }

  for (const { event, decks, stats } of generatedEvents) {
    const outputPath = path.join(OUTPUT_DIR, event.outputName);
    fs.writeFileSync(outputPath, `${JSON.stringify(stats, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${outputPath} (${decks.length} decks)`);
  }

  const seasonPerformance = aggregateSeasonCharacterPerformance(seasonEvents, '2026-09-06');
  const seasonOutputPath = path.join(OUTPUT_DIR, 's1-2026-character-performance.json');
  fs.writeFileSync(seasonOutputPath, `${JSON.stringify(seasonPerformance, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${seasonOutputPath} (${seasonPerformance.characters.length} characters)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
