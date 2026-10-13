import * as fs from 'fs';
import * as path from 'path';
import { calculateDeckIconTotals } from '../../src/services/deck-evaluation/iconTotals';

type AuditedSpecial = {
  collector_number: string;
  character_name: string;
  name: string;
  catalog_name?: string;
  icons: string[];
  value: number | null;
};
type ManifestSpecial = AuditedSpecial & { table: string; card_effect?: string };
const read = (file: string): string => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const audited = (JSON.parse(read('scripts/skybound/special-icon-audit.json')) as { cards: AuditedSpecial[] }).cards;
const allCards = (JSON.parse(read('scripts/skybound/skybound-manifest.json')) as { cards: ManifestSpecial[] }).cards;
const advanced = new Set(['112', '126', '131', '242']);
const specials = allCards.filter((card) => card.table === 'special_cards' && !advanced.has(card.collector_number));
const byNumber = new Map(specials.map((card) => [card.collector_number, card]));
const totalsFor = (numbers: string[], quantity = 1) => calculateDeckIconTotals(
  numbers.map((cardId) => ({ type: 'special', cardId, quantity })),
  (_type, cardId) => byNumber.get(cardId),
);

describe('complete Skybound Special printed-badge audit', () => {
  it('covers each current Special exactly once and matches all printed icons and values', () => {
    expect(audited).toHaveLength(237);
    expect(new Set(audited.map((card) => card.collector_number)).size).toBe(237);
    expect(new Set(specials.map((card) => card.collector_number))).toEqual(
      new Set(audited.map((card) => card.collector_number)),
    );
    for (const { catalog_name, ...expected } of audited) {
      expect(byNumber.get(expected.collector_number)).toMatchObject({ ...expected, name: catalog_name ?? expected.name });
    }
    expect(audited.filter((card) => card.icons.length === 0)).toHaveLength(139);
    expect(audited.filter((card) => card.icons.includes('Any-Power'))).toHaveLength(6);
  });

  it('repairs every exact printing through a guarded migration', () => {
    const sql = read('migrations/V371__Correct_all_skybound_special_icons_and_values.sql');
    const q = (value: string): string => `'${value.replace(/'/g, "''")}'`;
    for (const card of audited) {
      const fields = [q(card.collector_number), q(card.character_name), q(card.catalog_name ?? card.name),
        `ARRAY[${card.icons.map(q).join(', ')}]::text[]`, card.value === null ? 'NULL' : String(card.value)];
      expect(sql).toContain(`(${fields.join(', ')})`);
    }
    expect(sql.match(/^ {2}\('/gm)).toHaveLength(237);
    expect(sql).toContain("actual.set = 'SKY'");
    expect(sql).toContain('actual.is_foil = FALSE');
    expect(sql).toContain('matched <> 237');
    expect(sql).not.toMatch(/\b(?:DELETE|TRUNCATE)\b/i);
  });

  it('restores the screenshot totals without counting non-numerical references', () => {
    const screenshot = ['223', '224', '220', '225', '222', '221', '204', '202', '203', '199', '200', '201'];
    expect(totalsFor(screenshot)).toEqual({ energy: 0, combat: 3, bruteForce: 2, intelligence: 2 });
    expect(totalsFor(screenshot, 2)).toEqual({ energy: 0, combat: 6, bruteForce: 4, intelligence: 4 });
    expect(totalsFor(['066', '150', '223'])).toEqual({ energy: 0, combat: 0, bruteForce: 0, intelligence: 0 });
  });

  it('counts every combined and MultiPower badge once per type per copy', () => {
    expect(totalsFor(['006', '231'])).toEqual({ energy: 2, combat: 2, bruteForce: 2, intelligence: 2 });
    expect(totalsFor(['069', '077', '084', '118', '127', '171', '179', '180', '190', '193', '021']))
      .toEqual({ energy: 6, combat: 7, bruteForce: 8, intelligence: 5 });
  });

  it('keeps successful-hit conversions and Any-Power totals intact', () => {
    expect(totalsFor(['019', '246', '372'])).toEqual({ energy: 0, combat: 0, bruteForce: 3, intelligence: 0 });
    expect(totalsFor(audited.filter((card) => card.icons.includes('Any-Power')).map((card) => card.collector_number)))
      .toEqual({ energy: 0, combat: 0, bruteForce: 0, intelligence: 0 });
    expect(totalsFor(audited.map((card) => card.collector_number)))
      .toEqual({ energy: 20, combat: 25, bruteForce: 41, intelligence: 27 });
  });
});
