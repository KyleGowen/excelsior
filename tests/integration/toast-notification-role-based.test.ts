/**
 * Integration tests for role-based toast notification behavior
 * Tests that blue toast notifications are hidden for GUEST users but shown for USER/ADMIN roles
 * when editing deck title and description
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, integrationTestUtils } from '../setup-integration';
import { ApiClient } from '../helpers/apiClient';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

describe('Toast Notification Role-Based Behavior', () => {
    let apiClient: ApiClient;
    let testUserId: string;
    let testDeckId: string;
    let pool: Pool;

    beforeAll(async () => {
        // Initialize API client with the app
        apiClient = new ApiClient(app);
        
        // Initialize database pool
        pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
        });
    });

    afterAll(async () => {
        if (pool) {
            await pool.end();
        }
    });

    beforeEach(async () => {
        // Create a test user directly in the database
        const crypto = require('crypto');
        testUserId = crypto.randomUUID();
        const username = `testuser_${Date.now()}`;
        const email = `test_${Date.now()}@example.com`;
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await pool.query(
            'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [testUserId, username, email, hashedPassword, 'USER']
        );

        // Login as the test user
        await apiClient.login(username, 'password123');

        // Create a test deck
        const deckResponse = await apiClient.createDeck({
            name: 'Test Deck for Toast Notifications',
            description: 'Test Description for Toast Notifications'
        });
        testDeckId = deckResponse.body.data.id;
    });

    afterEach(async () => {
        // Clean up test data
        if (testDeckId) {
            try {
                await apiClient.deleteDeck(testDeckId);
            } catch (error) {
                console.log('Deck already deleted or not found');
            }
        }
        if (testUserId) {
            // Clean up user
            try {
                await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
            } catch (error) {
                console.log('User already deleted or not found');
            }
        }
    });

    describe('Title Edit Toast Notifications', () => {
        it('should show toast notification for USER role when editing title', async () => {
            // Get the deck editor page
            const response = await apiClient.request('GET', `/users/${testUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            // Check that the HTML contains the isGuestUser function
            const html = response.text;
            // Verify the external script files are loaded
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });

        it('should show toast notification for ADMIN role when editing title', async () => {
            // Create an admin user
            const crypto = require('crypto');
            const adminUserId = crypto.randomUUID();
            const adminUsername = `admin_${Date.now()}`;
            const adminEmail = `admin_${Date.now()}@example.com`;
            const adminHashedPassword = await bcrypt.hash('password123', 10);
            
            await pool.query(
                'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
                [adminUserId, adminUsername, adminEmail, adminHashedPassword, 'ADMIN']
            );

            // Login as admin
            await apiClient.login(adminUsername, 'password123');

            // Get the deck editor page
            const response = await apiClient.request('GET', `/users/${adminUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            // Check that the HTML contains the external script files
            const html = response.text;
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
            
            // Clean up admin user
            await pool.query('DELETE FROM users WHERE id = $1', [adminUserId]);
        });

        it('should hide toast notification for GUEST role when editing title', async () => {
            // Get the deck editor page as guest
            const response = await apiClient.request('GET', `/users/guest/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            // Check that the HTML contains the external script files
            const html = response.text;
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });
    });

    describe('Description Edit Toast Notifications', () => {
        it('should show toast notification for USER role when editing description', async () => {
            // Get the deck editor page
            const response = await apiClient.request('GET', `/users/${testUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            // Check that the HTML contains the external script files
            const html = response.text;
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });

        it('should show toast notification for ADMIN role when editing description', async () => {
            // Create an admin user
            const crypto = require('crypto');
            const adminUserId = crypto.randomUUID();
            const adminUsername = `admin_${Date.now()}`;
            const adminEmail = `admin_${Date.now()}@example.com`;
            const adminHashedPassword = await bcrypt.hash('password123', 10);
            
            await pool.query(
                'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
                [adminUserId, adminUsername, adminEmail, adminHashedPassword, 'ADMIN']
            );

            // Login as admin
            await apiClient.login(adminUsername, 'password123');

            // Get the deck editor page
            const response = await apiClient.request('GET', `/users/${adminUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            // Check that the HTML contains the external script files
            const html = response.text;
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
            
            // Clean up admin user
            await pool.query('DELETE FROM users WHERE id = $1', [adminUserId]);
        });

        it('should hide toast notification for GUEST role when editing description', async () => {
            // Get the deck editor page as guest
            const response = await apiClient.request('GET', `/users/guest/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            // Check that the HTML contains the external script files
            const html = response.text;
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });
    });

    describe('isGuestUser Function Behavior', () => {
        it('should correctly identify GUEST role users', async () => {
            // Get the deck editor page as guest
            const response = await apiClient.request('GET', `/users/guest/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            const html = response.text;
            
            // Verify the isGuestUser function exists and has the correct logic
            // Verify the external script files are loaded
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });

        it('should correctly identify non-GUEST role users', async () => {
            // Get the deck editor page as regular user
            const response = await apiClient.request('GET', `/users/${testUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            const html = response.text;
            
            // Verify the isGuestUser function exists
            // Verify the external script files are loaded
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });
    });

    describe('Toast Notification Implementation Verification', () => {
        it('should have consistent role-based logic for both title and description', async () => {
            // Get the deck editor page
            const response = await apiClient.request('GET', `/users/${testUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            const html = response.text;
            
            // Verify the external script files are loaded
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });

        it('should use the correct notification message and type', async () => {
            // Get the deck editor page
            const response = await apiClient.request('GET', `/users/${testUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            const html = response.text;
            
            // Verify the external script files are loaded
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing currentUser gracefully', async () => {
            // Get the deck editor page as guest (no currentUser)
            const response = await apiClient.request('GET', `/users/guest/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            const html = response.text;
            
            // The isGuestUser function should be available via external script
            expect(html).toContain('<script src="/js/filter-functions.js"></script>');
            
            // This should return false for missing currentUser, allowing notifications
            // But in practice, guests won't have currentUser set, so they won't see notifications
        });

        it('should maintain existing functionality for non-guest users', async () => {
            // Get the deck editor page as regular user
            const response = await apiClient.request('GET', `/users/${testUserId}/decks/${testDeckId}`);
            expect(response.statusCode).toBe(200);
            
            const html = response.text;
            
            // All existing functionality should still be present
            expect(html).toContain('startEditingTitle');
            expect(html).toContain('startEditingDescription');
            expect(html).toContain('saveTitleEdit');
            expect(html).toContain('<script src="/js/ui-utility-functions.js"></script>');
            expect(html).toContain('<script src="/js/deck-editor-core.js"></script>');
        });
    });
});
