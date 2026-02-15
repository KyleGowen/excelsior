/**
 * Generates V220__Populate_checklist_erb_world_legends.sql from the CSV export
 * Run: npx ts-node src/scripts/generateChecklistErbMigration.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function isFoilRow(cells: string[]): boolean {
  const trimmed = cells.map((c) => c.trim().toUpperCase());
  return trimmed.every((c) => c === 'FOIL');
}

async function main(): Promise<void> {
  const csvPath = path.join(
    process.env.HOME || '',
    'Desktop',
    'OverPower Check List.xlsx - Edgar Rice Burroughs and the World Legends .csv'
  );

  if (!fs.existsSync(csvPath)) {
    const projectPath = path.join(process.cwd(), 'data', 'checklist_erb_world_legends.csv');
    if (fs.existsSync(projectPath)) {
      console.log('Using project data file:', projectPath);
      await generateFromFile(projectPath);
      return;
    }
    console.error('CSV file not found at:', csvPath);
    console.error('Also checked:', projectPath);
    process.exit(1);
  }

  await generateFromFile(csvPath);
}

async function generateFromFile(csvPath: string): Promise<void> {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);

  const inserts: string[] = [];
  let skippedFoil = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 6) continue;

    if (isFoilRow(cells)) {
      skippedFoil++;
      continue;
    }

    const setVal = escapeSql(cells[0] || '');
    const numVal = escapeSql(cells[1] || '');
    const cardName = escapeSql(cells[2] || '');
    const cardSpecial = escapeSql(cells[3] || '');
    const rarity = escapeSql(cells[4] || '');
    const location = escapeSql(cells[5] || '');

    inserts.push(
      `INSERT INTO checklist_erb_world_legends ("Set", "#", "Card Name", "Card Special", "Rarity", "Location") VALUES ('${setVal}', '${numVal}', '${cardName}', '${cardSpecial}', '${rarity}', '${location}');`
    );
  }

  const sql = `-- Populate checklist_erb_world_legends from Edgar Rice Burroughs and the World Legends checklist
-- Generated from CSV export, FOIL header row excluded
-- Total rows: ${inserts.length}

${inserts.join('\n')}
`;

  const outputPath = path.join(process.cwd(), 'migrations', 'V220__Populate_checklist_erb_world_legends.sql');
  fs.writeFileSync(outputPath, sql);
  console.log(`Generated ${outputPath} with ${inserts.length} INSERT statements (skipped ${skippedFoil} FOIL row(s))`);
}

main().catch(console.error);
