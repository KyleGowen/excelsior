import * as fs from 'fs';
import * as path from 'path';

type Icon = 'Energy' | 'Combat' | 'Brute Force' | 'Intelligence' | 'Any-Power';

interface SpecialRow { id: string; name: string; character: string; effect: string }

const V24 = path.resolve(__dirname, '..', 'migrations', 'V24__Populate_special_cards_data.sql');
const OUT = path.resolve(__dirname, '..', 'migrations', 'V166__Populate_special_icons_and_values_using_v24.sql');

function load(): string { return fs.readFileSync(V24, 'utf8'); }

function parse(sql: string): SpecialRow[] {
  const rows: SpecialRow[] = [];
  const insertStart = sql.indexOf('INSERT INTO special_cards');
  if (insertStart === -1) return rows;
  const valuesBlock = sql.slice(insertStart).split('VALUES')[1];
  if (!valuesBlock) return rows;
  const tupleRegex = /\(([^\)]*)\)\s*,?/g;
  let m: RegExpExecArray | null;
  while ((m = tupleRegex.exec(valuesBlock)) !== null) {
    const tuple = m[1];
    const fields: string[] = [];
    let i = 0;
    while (i < tuple.length) {
      if (tuple[i] === "'") {
        let j = i + 1, s = '';
        while (j < tuple.length) {
          if (tuple[j] === "'" && tuple[j + 1] !== "'") break;
          if (tuple[j] === "'" && tuple[j + 1] === "'") { s += "'"; j += 2; continue; }
          s += tuple[j]; j++;
        }
        fields.push(s); i = j + 1; while (i < tuple.length && tuple[i] !== ',') i++; if (tuple[i] === ',') i++;
      } else { let j = i; while (j < tuple.length && tuple[j] !== ',') j++; fields.push(tuple.slice(i, j).trim()); i = j + 1; }
    }
    if (fields.length >= 6) {
      rows.push({ id: fields[0], name: fields[1], character: fields[2], effect: fields[4] });
    }
  }
  return rows;
}

function infer(effect: string): { types: Icon[]; value: number | null } {
  const types: Icon[] = [];
  const grab = (re: RegExp): number | null => { const m = effect.match(re); return m ? parseInt(m[1], 10) : null; };
  let n = grab(/Acts as a level\s+(\d+)\s+Any-?Power attack/i);
  if (n != null) return { types: ['Any-Power'], value: n };
  const candidates: Array<{ t: Icon; re: RegExp }> = [
    { t: 'Energy', re: /Acts as a level\s+(\d+)\s+Energy attack/i },
    { t: 'Combat', re: /Acts as a level\s+(\d+)\s+Combat attack/i },
    { t: 'Brute Force', re: /Acts as a level\s+(\d+)\s+Brute\s*Force attack/i },
    { t: 'Intelligence', re: /Acts as a level\s+(\d+)\s+Intelligence attack/i },
  ];
  let v: number | null = null;
  for (const c of candidates) { n = grab(c.re); if (n != null) { types.push(c.t); v = n; } }
  const multiWithTypes = effect.match(/Acts as a level\s+(\d+)\s+([A-Za-z\s,]+)\s+MultiPower attack/i);
  if (multiWithTypes) {
    const val = parseInt(multiWithTypes[1], 10);
    const chunk = multiWithTypes[2];
    if (/Energy/i.test(chunk)) types.push('Energy');
    if (/Combat/i.test(chunk)) types.push('Combat');
    if (/Brute\s*Force/i.test(chunk)) types.push('Brute Force');
    if (/Intelligence/i.test(chunk)) types.push('Intelligence');
    v = val;
  }
  const genericMulti = effect.match(/Acts as a level\s+(\d+)\s+MultiPower attack/i);
  if (genericMulti) {
    const val = parseInt(genericMulti[1], 10);
    types.push('Energy','Combat','Brute Force','Intelligence');
    v = val;
  }
  return { types: Array.from(new Set(types)), value: v };
}

function esc(s: string): string { return s.replace(/'/g, "''"); }

function main() {
  const sql = load();
  const rows = parse(sql);
  const out: string[] = [];
  out.push('-- Populate icons/value using names from V24 to avoid markdown quoting issues');
  const stripQuotes = (s: string) => s.replace(/^'+|'+$/g, '');
  for (const r of rows) {
    const inferred = infer(r.effect);
    const icons = inferred.types.length ? `ARRAY[${inferred.types.map(t => `'${esc(t)}'`).join(', ')}]` : 'NULL';
    const value = inferred.value != null ? String(inferred.value) : 'NULL';
    const nameClean = stripQuotes(r.name);
    const charClean = stripQuotes(r.character);
    out.push(`UPDATE special_cards SET icons = ${icons}, value = ${value}, updated_at = NOW() WHERE name = '${esc(nameClean)}' AND character_name = '${esc(charClean)}' AND (icons IS NULL OR value IS NULL);`);
  }
  fs.writeFileSync(OUT, out.join('\n') + '\n', 'utf8');
  console.log(`✅ Wrote ${rows.length} updates to ${OUT}`);
}

main();


