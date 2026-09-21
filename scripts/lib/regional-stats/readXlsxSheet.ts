import { execFileSync } from 'child_process';

function unzipEntry(xlsxPath: string, entry: string): string {
  return execFileSync('unzip', ['-p', xlsxPath, entry], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

function decodeXml(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    if (entity === 'amp') return '&';
    if (entity === 'lt') return '<';
    if (entity === 'gt') return '>';
    if (entity === 'quot') return '"';
    if (entity === 'apos') return "'";
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return match;
  });
}

function attribute(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return match ? decodeXml(match[1]) : null;
}

function columnIndex(reference: string): number {
  const letters = reference.match(/^[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function readSharedStrings(xlsxPath: string): string[] {
  let xml: string;
  try {
    xml = unzipEntry(xlsxPath, 'xl/sharedStrings.xml');
  } catch {
    return [];
  }

  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXml(textMatch[1]))
      .join(''),
  );
}

function sheetEntryForName(xlsxPath: string, sheetName: string): string {
  const workbookXml = unzipEntry(xlsxPath, 'xl/workbook.xml');
  const relsXml = unzipEntry(xlsxPath, 'xl/_rels/workbook.xml.rels');
  const sheet = [...workbookXml.matchAll(/<sheet\s+([^>]+?)\/>/g)]
    .map((match) => match[1])
    .find((attrs) => attribute(attrs, 'name') === sheetName);
  const relationshipId = sheet ? attribute(sheet, 'r:id') : null;
  if (!relationshipId) throw new Error(`Missing sheet: ${sheetName}`);

  const relationship = [...relsXml.matchAll(/<Relationship\s+([^>]+?)\/>/g)]
    .map((match) => match[1])
    .find((attrs) => attribute(attrs, 'Id') === relationshipId);
  const target = relationship ? attribute(relationship, 'Target') : null;
  if (!target) throw new Error(`Missing worksheet relationship for: ${sheetName}`);
  return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
}

function cellValue(body: string, type: string | null, sharedStrings: string[]): unknown {
  if (type === 'inlineStr') {
    return [...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join('');
  }

  const raw = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1];
  if (raw === undefined) return '';
  const decoded = decodeXml(raw);
  if (type === 's') return sharedStrings[Number(decoded)] ?? '';
  if (type === 'str') return decoded;
  if (type === 'b') return decoded === '1';
  const number = Number(decoded);
  return Number.isFinite(number) ? number : decoded;
}

/** Read cached cell values from one XLSX worksheet without adding a runtime package dependency. */
export function readXlsxSheetRows(xlsxPath: string, sheetName: string): unknown[][] {
  const sharedStrings = readSharedStrings(xlsxPath);
  const sheetXml = unzipEntry(xlsxPath, sheetEntryForName(xlsxPath, sheetName));
  const rows: unknown[][] = [];

  for (const rowMatch of sheetXml.matchAll(/<row\s+([^>]*[^/])>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(attribute(rowMatch[1], 'r')) || rows.length + 1;
    const row: unknown[] = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\s+([^>]*[^/])>([\s\S]*?)<\/c>/g)) {
      const reference = attribute(cellMatch[1], 'r');
      if (!reference) continue;
      row[columnIndex(reference)] = cellValue(
        cellMatch[2],
        attribute(cellMatch[1], 't'),
        sharedStrings,
      );
    }
    rows[rowNumber - 1] = row;
  }

  return rows;
}
