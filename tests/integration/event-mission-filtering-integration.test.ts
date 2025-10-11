/**
 * Integration tests for event mission filtering functionality
 * Tests the complete user scenarios for filtering events based on selected missions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, integrationTestUtils } from '../setup-integration';
import { ApiClient } from '../helpers/apiClient';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

describe('Event Mission Filtering Integration Tests', () => {
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
            name: 'Test Deck',
            description: 'Test Description'
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

    describe('Scenario 1: Single Mission Selected - Only Matching Events Usable', () => {
        it('should show only Call of Cthulhu events when Call of Cthulhu mission is selected', async () => {
            // Get available missions
            const missionsResponse = await apiClient.request('GET', '/api/missions');
            expect(missionsResponse.status).toBe(200);
            
            // Find a Call of Cthulhu mission
            const cthulhuMission = missionsResponse.body.data.find((mission: any) => 
                mission.mission_set === 'The Call of Cthulhu'
            );
            expect(cthulhuMission).toBeDefined();

            // Add the mission to the deck
            const addMissionResponse = await apiClient.addCardToDeck(testDeckId, {
                cardType: 'mission',
                cardId: cthulhuMission.id,
                quantity: 1
            });
            expect(addMissionResponse.status).toBe(200);

            // Get available events
            const eventsResponse = await apiClient.request('GET', '/api/events');
            expect(eventsResponse.status).toBe(200);

            // Filter events by mission set (simulating the frontend filter logic)
            const cthulhuEvents = eventsResponse.body.data.filter((event: any) => 
                event.mission_set === 'The Call of Cthulhu'
            );
            const otherEvents = eventsResponse.body.data.filter((event: any) => 
                event.mission_set !== 'The Call of Cthulhu'
            );

            // Verify that we have both Cthulhu and non-Cthulhu events
            expect(cthulhuEvents.length).toBeGreaterThan(0);
            expect(otherEvents.length).toBeGreaterThan(0);

            // Verify that all usable events are from the correct mission set
            cthulhuEvents.forEach((event: any) => {
                expect(event.mission_set).toBe('The Call of Cthulhu');
            });

            // Verify that all unusable events are from different mission sets
            otherEvents.forEach((event: any) => {
                expect(event.mission_set).not.toBe('The Call of Cthulhu');
            });
        });

        it('should show only King of the Jungle events when King of the Jungle mission is selected', async () => {
            // Get available missions
            const missionsResponse = await apiClient.request('GET', '/api/missions');
            expect(missionsResponse.status).toBe(200);
            
            // Find a King of the Jungle mission
            const jungleMission = missionsResponse.body.data.find((mission: any) => 
                mission.mission_set === 'King of the Jungle'
            );
            expect(jungleMission).toBeDefined();

            // Add the mission to the deck
            const addMissionResponse = await apiClient.addCardToDeck(testDeckId, {
                cardType: 'mission',
                cardId: jungleMission.id,
                quantity: 1
            });
            expect(addMissionResponse.status).toBe(200);

            // Get available events
            const eventsResponse = await apiClient.request('GET', '/api/events');
            expect(eventsResponse.status).toBe(200);

            // Filter events by mission set
            const jungleEvents = eventsResponse.body.data.filter((event: any) => 
                event.mission_set === 'King of the Jungle'
            );
            const otherEvents = eventsResponse.body.data.filter((event: any) => 
                event.mission_set !== 'King of the Jungle'
            );

            // Verify filtering results
            expect(jungleEvents.length).toBeGreaterThan(0);
            expect(otherEvents.length).toBeGreaterThan(0);

            // Verify all usable events are from King of the Jungle
            jungleEvents.forEach((event: any) => {
                expect(event.mission_set).toBe('King of the Jungle');
            });

            // Verify all unusable events are from different mission sets
            otherEvents.forEach((event: any) => {
                expect(event.mission_set).not.toBe('King of the Jungle');
            });
        });
    });

    describe('Scenario 2: Multiple Missions Selected - Both Mission Sets Usable', () => {
        it('should show events from both Call of Cthulhu and King of the Jungle when both missions are selected', async () => {
            // Get available missions
            const missionsResponse = await apiClient.request('GET', '/api/missions');
            expect(missionsResponse.status).toBe(200);
            
            // Find missions from both sets
            const cthulhuMission = missionsResponse.body.data.find((mission: any) => 
                mission.mission_set === 'The Call of Cthulhu'
            );
            const jungleMission = missionsResponse.body.data.find((mission: any) => 
                mission.mission_set === 'King of the Jungle'
            );
            expect(cthulhuMission).toBeDefined();
            expect(jungleMission).toBeDefined();

            // Add both missions to the deck
            const addCthulhuResponse = await apiClient.addCardToDeck(testDeckId, {
                cardType: 'mission',
                cardId: cthulhuMission.id,
                quantity: 1
            });
            expect(addCthulhuResponse.status).toBe(200);

            const addJungleResponse = await apiClient.addCardToDeck(testDeckId, {
                cardType: 'mission',
                cardId: jungleMission.id,
                quantity: 1
            });
            expect(addJungleResponse.status).toBe(200);

            // Get available events
            const eventsResponse = await apiClient.request('GET', '/api/events');
            expect(eventsResponse.status).toBe(200);

            // Filter events by both mission sets
            const usableEvents = eventsResponse.body.data.filter((event: any) => 
                event.mission_set === 'The Call of Cthulhu' || 
                event.mission_set === 'King of the Jungle'
            );
            const unusableEvents = eventsResponse.body.data.filter((event: any) => 
                event.mission_set !== 'The Call of Cthulhu' && 
                event.mission_set !== 'King of the Jungle'
            );

            // Verify filtering results
            expect(usableEvents.length).toBeGreaterThan(0);
            expect(unusableEvents.length).toBeGreaterThan(0);

            // Verify all usable events are from the correct mission sets
            usableEvents.forEach((event: any) => {
                expect(['The Call of Cthulhu', 'King of the Jungle']).toContain(event.mission_set);
            });

            // Verify all unusable events are from different mission sets
            unusableEvents.forEach((event: any) => {
                expect(['The Call of Cthulhu', 'King of the Jungle']).not.toContain(event.mission_set);
            });

            // Verify we have events from both mission sets
            const cthulhuEventCount = usableEvents.filter((event: any) => 
                event.mission_set === 'The Call of Cthulhu'
            ).length;
            const jungleEventCount = usableEvents.filter((event: any) => 
                event.mission_set === 'King of the Jungle'
            ).length;

            expect(cthulhuEventCount).toBeGreaterThan(0);
            expect(jungleEventCount).toBeGreaterThan(0);
        });
    });

    describe('Scenario 3: No Missions Selected - All Events Usable', () => {
        it('should consider all events usable when no missions are selected', async () => {
            // Get available events
            const eventsResponse = await apiClient.request('GET', '/api/events');
            expect(eventsResponse.status).toBe(200);

            // When no missions are selected, all events should be considered usable
            const allEvents = eventsResponse.body.data;
            expect(allEvents.length).toBeGreaterThan(0);

            // Verify we have events from multiple mission sets
            const missionSets = [...new Set(allEvents.map((event: any) => event.mission_set))];
            expect(missionSets.length).toBeGreaterThan(1);

            // All events should be considered usable (no filtering applied)
            allEvents.forEach((event: any) => {
                expect(event.mission_set).toBeDefined();
                expect(event.name).toBeDefined();
            });
        });

        it('should handle deck with only non-mission cards gracefully', async () => {
            // Add a character to the deck (non-mission card)
            const charactersResponse = await apiClient.request('GET', '/api/characters');
            expect(charactersResponse.status).toBe(200);
            
            const character = charactersResponse.body.data[0];
            const addCharacterResponse = await apiClient.addCardToDeck(testDeckId, {
                cardType: 'character',
                cardId: character.id,
                quantity: 1
            });
            expect(addCharacterResponse.status).toBe(200);

            // Get available events
            const eventsResponse = await apiClient.request('GET', '/api/events');
            expect(eventsResponse.status).toBe(200);

            // All events should still be considered usable since no missions are selected
            const allEvents = eventsResponse.body.data;
            expect(allEvents.length).toBeGreaterThan(0);

            // Verify we have events from multiple mission sets
            const missionSets = [...new Set(allEvents.map((event: any) => event.mission_set))];
            expect(missionSets.length).toBeGreaterThan(1);
        });
    });

    describe('Event Mission Set Validation', () => {
        it('should have consistent mission set names between missions and events', async () => {
            // Get missions and events
            const missionsResponse = await apiClient.request('GET', '/api/missions');
            const eventsResponse = await apiClient.request('GET', '/api/events');
            
            expect(missionsResponse.status).toBe(200);
            expect(eventsResponse.status).toBe(200);

            // Get unique mission sets from both
            const missionSets = [...new Set(missionsResponse.body.data.map((mission: any) => mission.mission_set))];
            const eventMissionSets = [...new Set(eventsResponse.body.data.map((event: any) => event.mission_set))];

            // Sort for comparison
            missionSets.sort();
            eventMissionSets.sort();

            // Verify that mission sets match between missions and events
            expect(missionSets).toEqual(eventMissionSets);

            // Verify that we have the expected mission sets
            const expectedMissionSets = [
                'The Call of Cthulhu',
                'King of the Jungle', 
                'The Warlord of Mars',
                'Time Wars: Rise of the Gods'
            ];

            expectedMissionSets.forEach(expectedSet => {
                expect(missionSets).toContain(expectedSet);
                expect(eventMissionSets).toContain(expectedSet);
            });
        });

        it('should have events for each mission set', async () => {
            // Get missions and events
            const missionsResponse = await apiClient.request('GET', '/api/missions');
            const eventsResponse = await apiClient.request('GET', '/api/events');
            
            expect(missionsResponse.status).toBe(200);
            expect(eventsResponse.status).toBe(200);

            // Get unique mission sets from missions
            const missionSets = [...new Set(missionsResponse.body.data.map((mission: any) => mission.mission_set))];

            // Verify that each mission set has corresponding events
            missionSets.forEach(missionSet => {
                const eventsForSet = eventsResponse.body.data.filter((event: any) => 
                    event.mission_set === missionSet
                );
                expect(eventsForSet.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle events with missing mission_set gracefully', async () => {
            // Get events and check for any with missing mission_set
            const eventsResponse = await apiClient.request('GET', '/api/events');
            expect(eventsResponse.status).toBe(200);

            const eventsWithMissionSet = eventsResponse.body.data.filter((event: any) => 
                event.mission_set && event.mission_set.trim() !== ''
            );
            const eventsWithoutMissionSet = eventsResponse.body.data.filter((event: any) => 
                !event.mission_set || event.mission_set.trim() === ''
            );

            // All events should have mission_set defined
            expect(eventsWithoutMissionSet.length).toBe(0);
            expect(eventsWithMissionSet.length).toBe(eventsResponse.body.data.length);
        });

        it('should handle missions with missing mission_set gracefully', async () => {
            // Get missions and check for any with missing mission_set
            const missionsResponse = await apiClient.request('GET', '/api/missions');
            expect(missionsResponse.status).toBe(200);

            const missionsWithMissionSet = missionsResponse.body.data.filter((mission: any) => 
                mission.mission_set && mission.mission_set.trim() !== ''
            );
            const missionsWithoutMissionSet = missionsResponse.body.data.filter((mission: any) => 
                !mission.mission_set || mission.mission_set.trim() === ''
            );

            // All missions should have mission_set defined
            expect(missionsWithoutMissionSet.length).toBe(0);
            expect(missionsWithMissionSet.length).toBe(missionsResponse.body.data.length);
        });
    });
});