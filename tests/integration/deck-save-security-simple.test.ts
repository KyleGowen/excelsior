/**
 * @jest-environment jsdom
 */

/**
 * Simple Integration Tests for Deck Save Security
 * 
 * This test suite ensures that deck saving works correctly under all scenarios
 * and prevents 403/404 errors from occurring again.
 * 
 * Test Coverage:
 * - Admin users can save their own decks
 * - Regular users can save their own decks
 * - Users cannot save decks they don't own (403 Forbidden)
 * - Guest users cannot save any decks
 * - Non-existent deck IDs return proper errors (404)
 * - API endpoints respond correctly for all scenarios
 */

import request from 'supertest';
import { app } from '../../src/index';

describe('Deck Save Security - Simple Integration Tests', () => {
    // Test data
    let adminUserId: string;
    let regularUserId: string;
    let adminDeckId: string;
    let regularUserDeckId: string;
    let nonExistentDeckId: string;

    beforeAll(async () => {
        // Create test users and decks
        const adminResponse = await request(app)
            .post('/api/users')
            .send({
                username: 'test-admin',
                email: 'admin@test.com',
                password: 'password123',
                role: 'ADMIN'
            });

        const regularUserResponse = await request(app)
            .post('/api/users')
            .send({
                username: 'test-regular',
                email: 'regular@test.com',
                password: 'password123',
                role: 'USER'
            });

        adminUserId = adminResponse.body.data.id;
        regularUserId = regularUserResponse.body.data.id;

        // Create test decks
        const adminDeckResponse = await request(app)
            .post('/api/decks')
            .set('Cookie', `session=${adminUserId}`)
            .send({
                name: 'Admin Test Deck',
                description: 'Test deck for admin user'
            });

        const regularUserDeckResponse = await request(app)
            .post('/api/decks')
            .set('Cookie', `session=${regularUserId}`)
            .send({
                name: 'Regular Test Deck',
                description: 'Test deck for regular user'
            });

        adminDeckId = adminDeckResponse.body.data.id;
        regularUserDeckId = regularUserDeckResponse.body.data.id;
        nonExistentDeckId = '00000000-0000-0000-0000-000000000000';
    });

    describe('Admin User Deck Save Scenarios', () => {
        it('should allow admin to save their own deck', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 },
                { cardType: 'power', cardId: 'test-power-1', quantity: 2 }
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: testCards })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(adminDeckId);
        });

        it('should allow admin to save deck with empty card list', async () => {
            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: [] })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Regular User Deck Save Scenarios', () => {
        it('should allow regular user to save their own deck', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 },
                { cardType: 'power', cardId: 'test-power-1', quantity: 2 }
            ];

            const response = await request(app)
                .put(`/api/decks/${regularUserDeckId}/cards`)
                .set('Cookie', `session=${regularUserId}`)
                .send({ cards: testCards })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(regularUserDeckId);
        });

        it('should prevent regular user from saving admin deck (403 Forbidden)', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${regularUserId}`)
                .send({ cards: testCards })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Access denied');
            expect(response.body.error).toContain('do not own this deck');
        });
    });

    describe('Guest User Restrictions', () => {
        it('should prevent guest user from saving any deck (403 Forbidden)', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .send({ cards: testCards })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Guests may not modify decks');
        });

        it('should prevent guest user from saving regular user deck (403 Forbidden)', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${regularUserDeckId}/cards`)
                .send({ cards: testCards })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Guests may not modify decks');
        });
    });

    describe('Non-Existent Deck Scenarios (404 Prevention)', () => {
        it('should return 404 for non-existent deck ID', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${nonExistentDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
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
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: testCards })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Authentication and Authorization Edge Cases', () => {
        it('should require authentication for deck save operations', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
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
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', 'session=invalid-session-id')
                .send({ cards: testCards })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Input Validation and Data Integrity', () => {
        it('should validate card data structure', async () => {
            const invalidCards = [
                { invalidField: 'test' } // Missing required fields
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
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
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
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
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
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
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: invalidCards })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('quantity must be a number between 1 and 10');
        });

        it('should validate cards array is provided', async () => {
            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({}) // No cards array
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cards must be an array');
        });

        it('should validate cards is an array', async () => {
            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: 'not-an-array' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cards must be an array');
        });
    });

    describe('API Response Consistency', () => {
        it('should return consistent response format for successful saves', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: testCards })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', adminDeckId);
            expect(response.body.data).toHaveProperty('name');
            expect(response.body.data).toHaveProperty('cards');
        });

        it('should return consistent error format for 403 errors', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${adminDeckId}/cards`)
                .set('Cookie', `session=${regularUserId}`)
                .send({ cards: testCards })
                .expect(403);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Access denied');
        });

        it('should return consistent error format for 404 errors', async () => {
            const testCards = [
                { cardType: 'character', cardId: 'test-char-1', quantity: 1 }
            ];

            const response = await request(app)
                .put(`/api/decks/${nonExistentDeckId}/cards`)
                .set('Cookie', `session=${adminUserId}`)
                .send({ cards: testCards })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Deck not found');
        });
    });
});
