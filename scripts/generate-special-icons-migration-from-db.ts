import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

const MD_PATH = path.resolve(__dirname, '..', 'docs', 'special-card-icons.md');
const FLYWAY_CONF = path.resolve(__dirname, '..', 'conf', 'flyway.conf');
const OUT_SQL = path.resolve(__dirname, '..', 'migrations', 'V166__Populate_special_icons_and_values_using_db_names.sql');

interface MdRow { character: string; name: string; types: string; values: string }

function parseFlywayConf(): { url: string; user: string; password?: string } {
  const txt = fs.readFileSync(FLYWAY_CONF, 'utf8');
  const lines = txt.split(/\r?\n/);
  const map: Record<string, string> = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    map[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  const url = map['flyway.url'];
  const user = map['flyway.user'];
  const password = map['flyway.password'];
  if (!url || !user) throw new Error('Missing flyway.url or flyway.user in conf/flyway.conf');
  return { url, user, password };
}

function parseMarkdown(md: string): MdRow[] {
  const lines = md.split(/\r?\n/);
  const rows: MdRow[] = [];
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 5) continue;
    if (parts[1] === 'Special Card') continue;
    const title = parts[1];
    const types = parts[2];
    const values = parts[3];
    const emIdx = title.indexOf('–');
    if (emIdx === -1) continue;
    const character = title.slice(0, emIdx).trim().replace(/^'|^"|\s+$/g, '').replace(/^'|'$/g, '');
    const nameQuoted = title.slice(emIdx + 1).trim();
    const nameMatch = nameQuoted.match(/"(.*)"/);
    const name = (nameMatch ? nameMatch[1] : nameQuoted).replace(/^'|'$/g, '').trim();
    rows.push({ character, name, types, values });
  }
  return rows;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/"/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '');
}

function esc(s: string): string { return s.replace(/'/g, "''"); }

function toArray(types: string): string | null {
  if (!types || types === '–') return null;
  const items = types.split(',').map(t => t.trim()).filter(Boolean);
  if (items.length === 0) return null;
  return `ARRAY[${items.map(i => `'${esc(i)}'`).join(', ')}]`;
}

function toValue(values: string): string | null {
  if (!values || values === '–') return null;
  const n = parseInt(values, 10);
  return Number.isNaN(n) ? null : String(n);
}

async function main() {
  const { url, user, password } = parseFlywayConf();
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const mdRows = parseMarkdown(md);

  const client = new Client({ connectionString: url.replace('jdbc:', ''), user, password });
  await client.connect();
  const { rows } = await client.query(`SELECT id, name, character_name FROM special_cards`);
  await client.end();

  const mdIndex = new Map<string, MdRow>();
  for (const r of mdRows) {
    mdIndex.set(`${norm(r.character)}|${norm(r.name)}`, r);
  }

  const out: string[] = [];
  out.push('-- Populate icons/value using database names to avoid quoting mismatches');
  for (const r of rows as Array<{id: string; name: string; character_name: string}>) {
    const key = `${norm(r.character_name)}|${norm(r.name)}`;
    const m = mdIndex.get(key);
    const icons = m ? toArray(m.types) : null;
    const value = m ? toValue(m.values) : null;
    const setIcons = icons ? `icons = ${icons}` : 'icons = NULL';
    const setValue = value !== null ? `value = ${value}` : 'value = NULL';
    out.push(`UPDATE special_cards SET ${setIcons}, ${setValue}, updated_at = NOW() WHERE id = '${r.id}';`);
  }
  fs.writeFileSync(OUT_SQL, out.join('\n') + '\n', 'utf8');
  console.log(`✅ Wrote ${rows.length} updates to ${OUT_SQL}`);
}

main().catch(e => { console.error(e); process.exit(1); });


