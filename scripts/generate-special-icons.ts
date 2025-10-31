import * as fs from 'fs';
import * as path from 'path';

type Icon = 'Energy' | 'Combat' | 'Brute Force' | 'Intelligence' | 'Any-Power';

interface SpecialRow {
  id: string;
  name: string;
  character: string;
  effect: string;
  image: string;
}

interface InferredIcons {
  icons: Array<{ type: Icon; value: number }>;
  notes?: string;
}

const MIGRATION_PATH = path.resolve(__dirname, '..', 'migrations', 'V24__Populate_special_cards_data.sql');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'docs', 'special-card-icons.md');

function loadSql(): string {
  return fs.readFileSync(MIGRATION_PATH, 'utf8');
}

function parseRows(sql: string): SpecialRow[] {
  const rows: SpecialRow[] = [];
  const insertStart = sql.indexOf('INSERT INTO special_cards');
  if (insertStart === -1) return rows;
  const valuesBlock = sql.slice(insertStart).split('VALUES')[1];
  if (!valuesBlock) return rows;
  const tupleRegex = /\(([^\)]*)\)\s*,?/g;
  let match: RegExpExecArray | null;
  while ((match = tupleRegex.exec(valuesBlock)) !== null) {
    const tuple = match[1];
    const fields: string[] = [];
    let i = 0;
    while (i < tuple.length) {
      const ch = tuple[i];
      if (ch === "'") {
        let j = i + 1;
        let s = '';
        while (j < tuple.length) {
          if (tuple[j] === "'" && tuple[j + 1] !== "'") {
            break;
          }
          if (tuple[j] === "'" && tuple[j + 1] === "'") {
            s += "'";
            j += 2;
            continue;
          }
          s += tuple[j];
          j++;
        }
        fields.push(s);
        i = j + 1;
        while (i < tuple.length && tuple[i] !== ',') i++;
        if (tuple[i] === ',') i++;
      } else {
        let j = i;
        while (j < tuple.length && tuple[j] !== ',') j++;
        const raw = tuple.slice(i, j).trim();
        fields.push(raw);
        i = j + 1;
      }
    }
    if (fields.length >= 6) {
      const [id, name, character, universe, effect, image] = fields;
      rows.push({ id, name, character, effect, image });
    }
  }
  return rows;
}

function inferIcons(effect: string): InferredIcons {
  const icons: Array<{ type: Icon; value: number }> = [];
  const val = (re: RegExp): number | null => {
    const m = effect.match(re);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return isNaN(n) ? null : n;
  };

  let n = val(/Acts as a level\s+(\d+)\s+Any-?Power attack/i);
  if (n != null) {
    icons.push({ type: 'Any-Power', value: n });
    return { icons };
  }

  const typeMap: Array<{ key: Icon; re: RegExp }> = [
    { key: 'Energy', re: /Acts as a level\s+(\d+)\s+Energy attack/i },
    { key: 'Combat', re: /Acts as a level\s+(\d+)\s+Combat attack/i },
    { key: 'Brute Force', re: /Acts as a level\s+(\d+)\s+Brute\s*Force attack/i },
    { key: 'Intelligence', re: /Acts as a level\s+(\d+)\s+Intelligence attack/i },
  ];
  for (const t of typeMap) {
    n = val(t.re);
    if (n != null) icons.push({ type: t.key, value: n });
  }

  const multiWithTypes = effect.match(/Acts as a level\s+(\d+)\s+([A-Za-z\s,]+)\s+MultiPower attack/i);
  if (multiWithTypes) {
    const v = parseInt(multiWithTypes[1], 10);
    const typesChunk = multiWithTypes[2];
    const typeMatches: Array<{ key: Icon; re: RegExp }> = [
      { key: 'Energy', re: /Energy/i },
      { key: 'Combat', re: /Combat/i },
      { key: 'Brute Force', re: /Brute\s*Force/i },
      { key: 'Intelligence', re: /Intelligence/i },
    ];
    for (const t of typeMatches) {
      if (t.re.test(typesChunk)) icons.push({ type: t.key, value: v });
    }
  }

  const genericMulti = effect.match(/Acts as a level\s+(\d+)\s+MultiPower attack/i);
  if (genericMulti) {
    const v = parseInt(genericMulti[1], 10);
    (['Energy', 'Combat', 'Brute Force', 'Intelligence'] as Icon[]).forEach((t) => icons.push({ type: t, value: v }));
  }

  if (icons.length === 0) {
    return { icons: [], notes: 'No typed attack detected' };
  }
  return { icons };
}

function toIconStr(inferred: InferredIcons): { types: string; values: string } {
  if (inferred.icons.length === 0) {
    return { types: '–', values: '–' };
  }
  const types = inferred.icons.map(i => i.type).join(', ');
  // Collapse duplicate values (e.g., MultiPower all-types at same level => single value)
  const uniqueValues = Array.from(new Set(inferred.icons.map(i => String(i.value))));
  const values = uniqueValues.join(', ');
  return { types, values };
}

function generateMarkdown(rows: SpecialRow[]): string {
  const header = `### Special card type icons and values\n\n` +
    `- Generated from database effects (V24) with icon/value inference.\n` +
    `- MultiPower without specified types shows Energy, Combat, Brute Force, Intelligence at the level; MultiPower with specific types shows only those.\n\n` +
    `| Special Card | Type Icons | Value(s) |\n|---|---|---|\n`;

  const lines: string[] = [];
  for (const r of rows) {
    const inferred = inferIcons(r.effect);
    const { types, values } = toIconStr(inferred);
    lines.push(`| ${r.character} – "${r.name}" | ${types} | ${values} |`);
  }
  return header + lines.join('\n') + '\n';
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const sql = loadSql();
  const rows = parseRows(sql);
  const md = generateMarkdown(rows);
  ensureDir(OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, md, 'utf8');
  console.log(`✅ Wrote ${rows.length} specials to ${OUTPUT_PATH}`);
}

main();


