/**
 * @jest-environment jsdom
 */

/**
 * API Integration Tests for Deck Save Security
 * 
 * This test suite ensures that the API endpoints properly handle deck save scenarios
 * and prevent 403/404 errors from occurring again.
 * 
 * Test Coverage:
 * - API endpoint validation and error responses
 * - Authentication and authorization checks
 * - Input validation and data integrity
 * - Error response consistency
 */

import request from 'supertest';
import { app } from '../../src/index';

describe('Deck Save Security - API Integration Tests', () => {
    // Use existing test users from setup
    const TEST_ADMIN_ID = 'test-admin-id';
    const TEST_USER_ID = 'test-user-id';
    const TEST_DECK_ID = 'test-deck-id';
    const NON_EXISTENT_DECK_ID = '00000000-0000-0000-0000-000000000000';

    describe('Authentication Requirements', () => {
        it('should require authentication for deck save operations', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .send({ cards: testCards })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Authentication required');
        });

        it('should handle invalid session cookies', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', 'session=invalid-session-id')
                .send({ cards: testCards })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should handle malformed session cookies', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', 'session=')
                .send({ cards: testCards })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Input Validation', () => {
        it('should validate card data structure', async () => {
            const invalidCards = [
                { invalidField: 'test' } // Missing required fields
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardType is required');
        });

        it('should validate card type field', async () => {
            const invalidCards = [
                { cardType: '', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardType is required');
        });

        it('should validate card ID field', async () => {
            const invalidCards = [
                { cardType: 'character', cardId: '', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardId is required');
        });

        it('should validate quantity field', async () => {
            const invalidCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 0 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('quantity must be a number between 1 and 10');
        });

        it('should validate maximum quantity', async () => {
            const invalidCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 11 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('quantity must be a number between 1 and 10');
        });

        it('should validate cards array is provided', async () => {
            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({}) // No cards array
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cards must be an array');
        });

        it('should validate cards is an array', async () => {
            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: 'not-an-array' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cards must be an array');
        });

        it('should validate maximum card limit', async () => {
            const tooManyCards = Array.from({ length: 101 }, (_, i) => ({
                cardType: 'character',
                cardId: `test-char-${i}`,
                quantity: 1
            }));

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: tooManyCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cannot replace more than 100 cards at once');
        });
    });

    describe('Deck ID Validation', () => {
        it('should return 404 for non-existent deck ID', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${NON_EXISTENT_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Deck not found');
        });

        it('should return 404 for malformed deck ID', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put('/api/decks/invalid-deck-id/cards')
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for empty deck ID', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put('/api/decks//cards')
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Security Validation', () => {
        it('should prevent SQL injection attempts', async () => {
            const maliciousCards = [
                { 
                    cardType: "'; DROP TABLE decks; --", 
                    cardId: 'test-char-1', 
                    quantity: 1 
                }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: maliciousCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardType must be 50 characters or less');
        });

        it('should prevent XSS attempts in card data', async () => {
            const xssCards = [
                { 
                    cardType: 'character', 
                    cardId: '<script>alert("xss")</script>', 
                    quantity: 1 
                }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: xssCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardId must be 100 characters or less');
        });

        it('should validate field length limits', async () => {
            const longCardType = 'a'.repeat(51); // Exceeds 50 character limit
            const testCards = [
                { cardType: longCardType, cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardType must be 50 characters or less');
        });

        it('should validate card ID length limits', async () => {
            const longCardId = 'a'.repeat(101); // Exceeds 100 character limit
            const testCards = [
                { cardType: 'character', cardId: longCardId, quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cardId must be 100 characters or less');
        });
    });

    describe('Error Response Consistency', () => {
        it('should return consistent error format for 400 errors', async () => {
            const invalidCards = [
                { cardType: '', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');
        });

        it('should return consistent error format for 401 errors', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .send({ cards: testCards })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Authentication required');
        });

        it('should return consistent error format for 404 errors', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${NON_EXISTENT_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Deck not found');
        });
    });

    describe('Request Method Validation', () => {
        it('should only accept PUT requests for deck save', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            // Test GET request
            await request(app)
                .get(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404); // Should not match the PUT route

            // Test POST request
            await request(app)
                .post(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404); // Should not match the PUT route

            // Test DELETE request
            await request(app)
                .delete(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards })
                .expect(404); // Should not match the PUT route
        });
    });

    describe('Content Type Validation', () => {
        it('should accept JSON content type', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .set('Content-Type', 'application/json')
                .send({ cards: testCards });

            // Should not fail due to content type
            expect([200, 403, 404]).toContain(response.status);
        });

        it('should handle missing content type', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${TEST_DECK_ID}/cards`)
                .set('Cookie', `session=${TEST_ADMIN_ID}`)
                .send({ cards: testCards });

            // Should not fail due to missing content type
            expect([200, 400, 403, 404]).toContain(response.status);
        });
    });
});
