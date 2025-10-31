import * as fs from 'fs';
import * as path from 'path';

const MD_PATH = path.resolve(__dirname, '..', 'docs', 'special-card-icons.md');
const OUT_SQL = path.resolve(__dirname, '..', 'migrations', 'V165__Populate_special_icons_and_values.sql');

interface Row {
  character: string;
  name: string;
  types: string; // e.g., "Energy, Combat" or "–"
  values: string; // e.g., "7" or "–"
}

function parseMarkdown(md: string): Row[] {
  const lines = md.split(/\r?\n/);
  const rows: Row[] = [];
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    // | Character – "Name" | Types | Values |
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 5) continue;
    const title = parts[1];
    const types = parts[2];
    const values = parts[3];
    if (title === 'Special Card' || title === '---') continue;
    // Title format: '<character> – "<name>"'
    const emDashIdx = title.indexOf('–');
    if (emDashIdx === -1) continue;
    const character = title.slice(0, emDashIdx).trim().replace(/^'|^"|\s+$/g, '').replace(/^'|'$/g, '');
    const nameQuoted = title.slice(emDashIdx + 1).trim();
    const nameMatch = nameQuoted.match(/"(.*)"/);
    const name = nameMatch ? nameMatch[1] : nameQuoted.replace(/^'|'$/g, '');
    rows.push({ character, name, types, values });
  }
  return rows;
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function toSqlArray(types: string): string | null {
  if (!types || types === '–') return null;
  const items = types.split(',').map(t => t.trim()).filter(Boolean);
  if (items.length === 0) return null;
  const arr = items.map(t => `'${esc(t)}'`).join(', ');
  return `ARRAY[${arr}]`;
}

function toValue(values: string): string | null {
  if (!values || values === '–') return null;
  const n = parseInt(values, 10);
  if (Number.isNaN(n)) return null;
  return String(n);
}

function generateSql(rows: Row[]): string {
  const lines: string[] = [];
  lines.push('-- Populate icons and value for special_cards based on generated markdown');
  lines.push('');
  for (const r of rows) {
    const icons = toSqlArray(r.types);
    const value = toValue(r.values);
    const sets: string[] = [];
    if (icons) sets.push(`icons = ${icons}`); else sets.push('icons = NULL');
    if (value !== null) sets.push(`value = ${value}`); else sets.push('value = NULL');
    sets.push('updated_at = NOW()');
    const stmt = `UPDATE special_cards SET ${sets.join(', ')} WHERE name = '${esc(r.name)}' AND character_name = '${esc(r.character)}';`;
    lines.push(stmt);
  }
  lines.push('');
  // Optional verification comment
  lines.push('-- Note: If any rows are not updated (0 rows), verify name/character spelling and punctuation.');
  return lines.join('\n');
}

function main() {
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const rows = parseMarkdown(md);
  const sql = generateSql(rows);
  fs.writeFileSync(OUT_SQL, sql, 'utf8');
  console.log(`✅ Wrote migration with ${rows.length} UPDATE statements to ${OUT_SQL}`);
}

main();


