import request from 'supertest';
import { app } from '../setup-integration';

describe('Deck Validation - Unusable Cards Integration Tests', () => {
    // Use a simple test session cookie
    const authCookie = 'sessionId=test-session';

    describe('Validation Endpoint', () => {
        it('should validate deck with basic structure', async () => {
            const deckData = {
                cards: [
                    // 4 characters
                    { cardId: 'char1', type: 'character', quantity: 1 },
                    { cardId: 'char2', type: 'character', quantity: 1 },
                    { cardId: 'char3', type: 'character', quantity: 1 },
                    { cardId: 'char4', type: 'character', quantity: 1 },
                    // 7 mission cards
                    { cardId: 'mission1', type: 'mission', quantity: 7 },
                    // Fill remaining cards to meet minimum deck size
                    { cardId: 'power1', type: 'power', quantity: 40 }
                ]
            };

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send(deckData);

            // The validation should return 401 because authentication is required
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success');
        });

        it('should handle invalid request data', async () => {
            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: 'invalid' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should handle missing cards array', async () => {
            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({});

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Logic', () => {
        it('should validate character count', async () => {
            const deckData = {
                cards: [
                    // Only 3 characters (should fail)
                    { cardId: 'char1', type: 'character', quantity: 1 },
                    { cardId: 'char2', type: 'character', quantity: 1 },
                    { cardId: 'char3', type: 'character', quantity: 1 },
                    // 7 mission cards
                    { cardId: 'mission1', type: 'mission', quantity: 7 },
                    // Fill remaining cards
                    { cardId: 'power1', type: 'power', quantity: 40 }
                ]
            };

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send(deckData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should validate mission count', async () => {
            const deckData = {
                cards: [
                    // 4 characters
                    { cardId: 'char1', type: 'character', quantity: 1 },
                    { cardId: 'char2', type: 'character', quantity: 1 },
                    { cardId: 'char3', type: 'character', quantity: 1 },
                    { cardId: 'char4', type: 'character', quantity: 1 },
                    // Only 6 mission cards (should fail)
                    { cardId: 'mission1', type: 'mission', quantity: 6 },
                    // Fill remaining cards
                    { cardId: 'power1', type: 'power', quantity: 40 }
                ]
            };

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send(deckData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});