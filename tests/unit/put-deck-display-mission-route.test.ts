import express from 'express';
import request from 'supertest';

describe('PUT /api/decks/:id display_mission_card_id validation', () => {
  const mockUpdateDeck = jest.fn();
  const mockGetDeckById = jest.fn();

  const authUser = (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'USER' };
    next();
  };

  const app = express();
  app.use(express.json());

  // Minimal route mirroring the display_mission_card_id validation in src/index.ts
  app.put('/api/decks/:id', authUser, async (req: any, res) => {
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }

    let { display_mission_card_id } = req.body;

    if (display_mission_card_id === '') {
      display_mission_card_id = null;
    }

    if (display_mission_card_id !== undefined && display_mission_card_id !== null) {
      if (typeof display_mission_card_id !== 'string' || display_mission_card_id.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'display_mission_card_id must be a string with 50 characters or less or null',
        });
      }
    }

    const deck = await mockGetDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }

    const updatedDeck = await mockUpdateDeck(req.params.id, { display_mission_card_id });
    return res.json({ success: true, data: updatedDeck });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDeckById.mockResolvedValue({ id: 'deck-1', user_id: 'user-1' });
    mockUpdateDeck.mockResolvedValue({ id: 'deck-1', display_mission_card_id: null });
  });

  it('rejects non-string display_mission_card_id', async () => {
    const res = await request(app)
      .put('/api/decks/deck-1')
      .send({ display_mission_card_id: 123 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('display_mission_card_id');
  });

  it('rejects overly long display_mission_card_id', async () => {
    const longId = 'x'.repeat(51);
    const res = await request(app)
      .put('/api/decks/deck-1')
      .send({ display_mission_card_id: longId });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('display_mission_card_id');
  });

  it('normalizes empty string to null and passes through to updateDeck', async () => {
    await request(app)
      .put('/api/decks/deck-1')
      .send({ display_mission_card_id: '' })
      .expect(200);

    expect(mockUpdateDeck).toHaveBeenCalledWith('deck-1', { display_mission_card_id: null });
  });

  it('accepts a valid string and passes through to updateDeck', async () => {
    const id = '00000000-0000-0000-0000-000000000123';
    await request(app)
      .put('/api/decks/deck-1')
      .send({ display_mission_card_id: id })
      .expect(200);

    expect(mockUpdateDeck).toHaveBeenCalledWith('deck-1', { display_mission_card_id: id });
  });
});

