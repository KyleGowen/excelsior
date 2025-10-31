import * as fs from 'fs';
import * as path from 'path';

type Icon = 'Energy' | 'Combat' | 'Brute Force' | 'Intelligence' | 'Any-Power';

interface AspectRow { name: string; description: string }

const V30 = path.resolve(__dirname, '..', 'migrations', 'V30__Populate_aspects_data.sql');
const OUT = path.resolve(__dirname, '..', 'migrations', 'V168__Populate_aspects_icons_and_values_using_v30.sql');

function load(): string { return fs.readFileSync(V30, 'utf8'); }

function parse(sql: string): AspectRow[] {
  const rows: AspectRow[] = [];
  const valuesBlock = sql.split('VALUES')[1] || '';
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
    // id, name, universe, location, aspect_description, one_per_deck, fortifications, image_path, alternate_images
    if (fields.length >= 5) {
      rows.push({ name: fields[1], description: fields[4] });
    }
  }
  return rows;
}

function inferIcons(effect: string): { types: Icon[]; value: number | null } {
  const grab = (re: RegExp) => { const m = effect.match(re); return m ? parseInt(m[1], 10) : null; };
  let n = grab(/level\s+(\d+)\s+Any-?Power attack/i);
  if (n != null) return { types: ['Any-Power'], value: n };
  const out: Icon[] = [];
  const map: Array<{ t: Icon; re: RegExp }> = [
    { t: 'Energy', re: /level\s+(\d+)\s+Energy attack/i },
    { t: 'Combat', re: /level\s+(\d+)\s+Combat attack/i },
    { t: 'Brute Force', re: /level\s+(\d+)\s+Brute\s*Force attack/i },
    { t: 'Intelligence', re: /level\s+(\d+)\s+Intelligence attack/i },
  ];
  let val: number | null = null;
  for (const mapp of map) {
    n = grab(mapp.re);
    if (n != null) { out.push(mapp.t); val = n; }
  }
  const multiWith = effect.match(/level\s+(\d+)\s+([A-Za-z\s,]+)\s+MultiPower attack/i);
  if (multiWith) {
    const v = parseInt(multiWith[1], 10);
    const chunk = multiWith[2];
    if (/Energy/i.test(chunk)) out.push('Energy');
    if (/Combat/i.test(chunk)) out.push('Combat');
    if (/Brute\s*Force/i.test(chunk)) out.push('Brute Force');
    if (/Intelligence/i.test(chunk)) out.push('Intelligence');
    val = v;
  }
  const genericMulti = effect.match(/level\s+(\d+)\s+MultiPower attack/i);
  if (genericMulti) {
    const v = parseInt(genericMulti[1], 10);
    out.push('Energy','Combat','Brute Force','Intelligence');
    val = v;
  }
  return { types: Array.from(new Set(out)), value: val };
}

function esc(s: string): string { return s.replace(/'/g, "''"); }

function main() {
  const sql = load();
  const rows = parse(sql);
  const out: string[] = [];
  out.push('-- Populate aspects icons/value using V30 names');
  for (const r of rows) {
    const inferred = inferIcons(r.description);
    const icons = inferred.types.length ? `ARRAY[${inferred.types.map(t => `'${esc(t)}'`).join(', ')}]` : 'NULL';
    const value = inferred.value != null ? String(inferred.value) : 'NULL';
    const nameClean = r.name.replace(/^'+|'+$/g, '');
    out.push(`UPDATE aspects SET icons = ${icons}, value = ${value}, updated_at = NOW() WHERE name = '${esc(nameClean)}';`);
  }
  fs.writeFileSync(OUT, out.join('\n') + '\n', 'utf8');
  console.log(`✅ Wrote ${rows.length} updates to ${OUT}`);
}

main();


