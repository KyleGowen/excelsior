import request from 'supertest';
import { app } from '../../../src/index';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';

const requiredMessage = 'ERB Any Character Special cards (including ERBP promos) require the "Rainbow Bridge" Battleground in your deck';

describe('Rainbow Bridge migrated catalog and stateless deck rules', () => {
  it('exposes the ERBP Battleground and applies its permission to ERB and promo specials', async () => {
    const pool = DataSourceConfig.getInstance().getPool();
    const catalog = await request(app).get('/api/v1/catalog/battlegrounds').expect(200);
    const bridge = catalog.body.data.find((card: { name: string }) => card.name === 'Rainbow Bridge');
    expect(bridge).toMatchObject({ set: 'ERBP', is_foil: false, set_number: null, rarity: null,
      image_path: 'erbp/battlegrounds/rainbow_bridge.png' });
    const printings = (await pool.query(`SELECT DISTINCT ON (set) id, set FROM special_cards
      WHERE character_name = 'Any Character' AND set IN ('ERB', 'ERBP') ORDER BY set, id`)).rows;
    expect(printings.map(card => card.set).sort()).toEqual(['ERB', 'ERBP']);
    const counts = async () => (await pool.query(`SELECT (SELECT count(*) FROM decks) AS decks,
      (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM collection_cards) AS collection`)).rows;
    const before = await counts();
    for (const printing of printings) {
      const special = { type: 'special', cardId: printing.id, quantity: 1 };
      const battleground = { type: 'battleground', cardId: bridge.id, quantity: 1 };
      const candidates = [{ catalogType: 'special-cards', cardId: printing.id }];
      for (const [cards, usable] of [[[], false], [[battleground], true], [[], false]] as const) {
        const evaluated = await request(app).post('/api/v1/decks/candidates/evaluate')
          .send({ schemaVersion: 1, revision: 1, cards, candidates }).expect(200);
        expect(evaluated.body.data.candidates[0]).toMatchObject({ cardId: printing.id, usable });
      }
      const draft = { schemaVersion: 1, draftId: 'rainbow-bridge-integration', revision: 1,
        reserveCharacterId: null, limited: false, format: 'venture', koCharacterIds: [] };
      const missing = await request(app).post('/api/v1/decks/evaluate')
        .send({ ...draft, cards: [special] }).expect(200);
      const allowed = await request(app).post('/api/v1/decks/evaluate')
        .send({ ...draft, cards: [special, battleground] }).expect(200);
      expect(missing.body.data.legality.reasons.map((reason: { message: string }) => reason.message)).toContain(requiredMessage);
      expect(allowed.body.data.legality.reasons.map((reason: { message: string }) => reason.message)).not.toContain(requiredMessage);
    }
    expect(await counts()).toEqual(before);
  });
});
