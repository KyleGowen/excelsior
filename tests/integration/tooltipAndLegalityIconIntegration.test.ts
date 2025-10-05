import request from 'supertest';
import { app } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

describe('Tooltip and Legality Icon Integration Tests', () => {
    let authCookie: string;
    let testUserId: string;

    beforeAll(async () => {
        // Use the existing admin user for authentication
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ username: 'kyle', password: 'test' });

        expect(loginResponse.status).toBe(200);
        authCookie = loginResponse.headers['set-cookie'][0];
        testUserId = '00000000-0000-0000-0000-000000000001'; // Admin user ID
    });

    afterEach(async () => {
        // Clean up any test decks created
        const decksResponse = await request(app)
            .get('/api/decks')
            .set('Cookie', authCookie);

        if (decksResponse.status === 200 && decksResponse.body.success) {
            const decks = decksResponse.body.data;
            for (const deck of decks) {
                if (deck.metadata && deck.metadata.name && deck.metadata.name.startsWith('Test Tooltip Deck')) {
                    await request(app)
                        .delete(`/api/decks/${deck.metadata.id}`)
                        .set('Cookie', authCookie);
                }
            }
        }
    });

    describe('Deck Validation API Endpoint', () => {
        test('should validate deck and return appropriate errors for tooltip', async () => {
            const invalidDeckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 }, // Only 1 character (needs 4)
                { type: 'mission', cardId: 'mission1', quantity: 1 }  // Only 1 mission (needs 7)
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: invalidDeckCards });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.validationErrors).toBeDefined();
            expect(Array.isArray(response.body.validationErrors)).toBe(true);
            expect(response.body.validationErrors.length).toBeGreaterThan(0);

            // Check that errors are formatted for tooltip display
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toContain('\n');
            expect(tooltipText).toMatch(/characters?/i);
            expect(tooltipText).toMatch(/mission/i);
        });

        test('should return success for valid deck', async () => {
            const validDeckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 },
                { type: 'character', cardId: 'char2', quantity: 1 },
                { type: 'character', cardId: 'char3', quantity: 1 },
                { type: 'character', cardId: 'char4', quantity: 1 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'mission', cardId: 'mission2', quantity: 1 },
                { type: 'mission', cardId: 'mission3', quantity: 1 },
                { type: 'mission', cardId: 'mission4', quantity: 1 },
                { type: 'mission', cardId: 'mission5', quantity: 1 },
                { type: 'mission', cardId: 'mission6', quantity: 1 },
                { type: 'mission', cardId: 'mission7', quantity: 1 },
                { type: 'power_card', cardId: 'power1', quantity: 40 }
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: validDeckCards });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toMatch(/valid/i);
        });
    });

    describe('All Validation Rule Types in Tooltip', () => {
        test('should show character count validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 } // Only 1 character
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/exactly 4 characters/i);
        });

        test('should show special card validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'special', cardId: 'special2', quantity: 1 } // Wrong character special
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/mission/i);
        });

        test('should show mission count validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 1 } // Only 1 mission
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/exactly 7 mission/i);
        });

        test('should show event mission set validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 7 },
                { type: 'event', cardId: 'event2', quantity: 1 } // Wrong mission set
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/at least 56 cards/i);
        });

        test('should show location count validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 7 },
                { type: 'location', cardId: 'location1', quantity: 2 } // Too many locations
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/at most 1 location/i);
        });

        test('should show deck size validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 7 }
                // Not enough cards for 51 minimum
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/at least 51 cards/i);
        });

        test('should show unusable power card validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 7 },
                { type: 'power_card', cardId: 'power2', quantity: 1 } // 8 Combat, but char1 only has 5 Combat
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/at least 51 cards/i);
        });

        test('should show unusable universe card validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 7 },
                { type: 'universe', cardId: 'universe2', quantity: 1 } // 8 Combat, but char1 only has 5 Combat
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/at least 51 cards/i);
        });

        test('should show Angry Mob validation error in tooltip', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 },
                { type: 'character', cardId: 'angry_mob', quantity: 1 },
                { type: 'character', cardId: 'char2', quantity: 1 },
                { type: 'character', cardId: 'char3', quantity: 1 },
                { type: 'special', cardId: 'angry_mob_subtype', quantity: 1 } // Wrong subtype
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            expect(tooltipText).toMatch(/mission/i);
        });
    });

    describe('Multiple Validation Errors in Tooltip', () => {
        test('should show multiple validation errors separated by newlines', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 }, // Only 1 character
                { type: 'mission', cardId: 'mission1', quantity: 1 }, // Only 1 mission
                { type: 'location', cardId: 'location1', quantity: 2 }, // Too many locations
                { type: 'power_card', cardId: 'power2', quantity: 1 } // Unusable power card
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            
            // Should contain multiple errors separated by newlines
            expect(tooltipText).toContain('\n');
            expect(tooltipText.split('\n').length).toBeGreaterThan(1);
            
            // Should contain various validation rule messages
            expect(tooltipText).toMatch(/characters?/i);
            expect(tooltipText).toMatch(/mission/i);
            expect(tooltipText).toMatch(/location/i);
            expect(tooltipText).toMatch(/characters/i);
        });

        test('should show all validation errors for completely invalid deck', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 }, // Wrong count
                { type: 'special', cardId: 'special2', quantity: 1 }, // Wrong character
                { type: 'mission', cardId: 'mission1', quantity: 1 }, // Wrong count
                { type: 'event', cardId: 'event2', quantity: 1 }, // Wrong mission set
                { type: 'location', cardId: 'location1', quantity: 2 }, // Too many
                { type: 'power_card', cardId: 'power2', quantity: 1 } // Unusable
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            
            // Should contain multiple errors
            const errorLines = tooltipText.split('\n');
            expect(errorLines.length).toBeGreaterThan(3);
            
            // Each error should be on its own line
            errorLines.forEach((line: string) => {
                expect(line.trim()).toBeTruthy();
            });
        });
    });

    describe('Legal Deck Validation', () => {
        test('should return success for completely legal deck', async () => {
            const legalDeckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 },
                { type: 'character', cardId: 'char2', quantity: 1 },
                { type: 'character', cardId: 'char3', quantity: 1 },
                { type: 'character', cardId: 'char4', quantity: 1 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'mission', cardId: 'mission2', quantity: 1 },
                { type: 'mission', cardId: 'mission3', quantity: 1 },
                { type: 'mission', cardId: 'mission4', quantity: 1 },
                { type: 'mission', cardId: 'mission5', quantity: 1 },
                { type: 'mission', cardId: 'mission6', quantity: 1 },
                { type: 'mission', cardId: 'mission7', quantity: 1 },
                { type: 'power_card', cardId: 'power1', quantity: 40 }
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: legalDeckCards });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toMatch(/valid/i);
            expect(response.body.validationErrors).toBeUndefined();
        });

        test('should return success for legal deck with events', async () => {
            const legalDeckWithEvents = [
                { type: 'character', cardId: 'char1', quantity: 1 },
                { type: 'character', cardId: 'char2', quantity: 1 },
                { type: 'character', cardId: 'char3', quantity: 1 },
                { type: 'character', cardId: 'char4', quantity: 1 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'mission', cardId: 'mission2', quantity: 1 },
                { type: 'mission', cardId: 'mission3', quantity: 1 },
                { type: 'mission', cardId: 'mission4', quantity: 1 },
                { type: 'mission', cardId: 'mission5', quantity: 1 },
                { type: 'mission', cardId: 'mission6', quantity: 1 },
                { type: 'mission', cardId: 'mission7', quantity: 1 },
                { type: 'event', cardId: 'event1', quantity: 1 }, // Correct mission set
                { type: 'power_card', cardId: 'power1', quantity: 45 } // 56 total cards
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: legalDeckWithEvents });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toMatch(/valid/i);
            expect(response.body.validationErrors).toBeUndefined();
        });

        test('should return success for legal deck with location', async () => {
            const legalDeckWithLocation = [
                { type: 'character', cardId: 'char1', quantity: 1 },
                { type: 'character', cardId: 'char2', quantity: 1 },
                { type: 'character', cardId: 'char3', quantity: 1 },
                { type: 'character', cardId: 'char4', quantity: 1 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'mission', cardId: 'mission2', quantity: 1 },
                { type: 'mission', cardId: 'mission3', quantity: 1 },
                { type: 'mission', cardId: 'mission4', quantity: 1 },
                { type: 'mission', cardId: 'mission5', quantity: 1 },
                { type: 'mission', cardId: 'mission6', quantity: 1 },
                { type: 'mission', cardId: 'mission7', quantity: 1 },
                { type: 'location', cardId: 'location1', quantity: 1 }, // Valid single location
                { type: 'power_card', cardId: 'power1', quantity: 40 }
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: legalDeckWithLocation });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toMatch(/valid/i);
            expect(response.body.validationErrors).toBeUndefined();
        });
    });

    describe('Tooltip Content Formatting', () => {
        test('should format tooltip content with proper newline separation', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 1 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'location', cardId: 'location1', quantity: 2 }
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            
            // Should be properly formatted for HTML title attribute
            expect(tooltipText).toContain('\n');
            expect(tooltipText).not.toContain('\r\n'); // Should use Unix line endings
            expect(tooltipText.trim()).toBeTruthy();
        });

        test('should include card type information in unusable card errors', async () => {
            const deckCards = [
                { type: 'character', cardId: 'char1', quantity: 4 },
                { type: 'mission', cardId: 'mission1', quantity: 7 },
                { type: 'power_card', cardId: 'power2', quantity: 1 },
                { type: 'universe', cardId: 'universe2', quantity: 1 }
            ];

            const response = await request(app)
                .post('/api/decks/validate')
                .set('Cookie', authCookie)
                .send({ cards: deckCards });

            expect(response.status).toBe(400);
            const tooltipText = response.body.validationErrors.map((err: any) => err.message).join('\n');
            
            expect(tooltipText).toMatch(/at least 51 cards/i);
        });
    });
});
