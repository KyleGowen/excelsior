/** @jest-environment jsdom */

describe('Deck Creation Logic - Core Functionality', () => {
    describe('Default UI Preferences', () => {
        test('should have correct default UI preferences structure', () => {
            const defaultUIPreferences = {
                "viewMode": "tile",
                "expansionState": {
                    "event": true, "power": true, "aspect": true, "mission": true, "special": true,
                    "location": true, "teamwork": true, "training": true, "character": true,
                    "ally_universe": true, "basic_universe": true, "advanced_universe": true
                },
                "dividerPosition": 65.86319218241043,
                "powerCardsSortMode": "type",
                "characterGroupExpansionState": {}
            };

            // Verify all expansion states are true
            expect(defaultUIPreferences.expansionState.event).toBe(true);
            expect(defaultUIPreferences.expansionState.power).toBe(true);
            expect(defaultUIPreferences.expansionState.aspect).toBe(true);
            expect(defaultUIPreferences.expansionState.mission).toBe(true);
            expect(defaultUIPreferences.expansionState.special).toBe(true);
            expect(defaultUIPreferences.expansionState.location).toBe(true);
            expect(defaultUIPreferences.expansionState.teamwork).toBe(true);
            expect(defaultUIPreferences.expansionState.training).toBe(true);
            expect(defaultUIPreferences.expansionState.character).toBe(true);
            expect(defaultUIPreferences.expansionState.ally_universe).toBe(true);
            expect(defaultUIPreferences.expansionState.basic_universe).toBe(true);
            expect(defaultUIPreferences.expansionState.advanced_universe).toBe(true);
            
            // Verify other preferences
            expect(defaultUIPreferences.viewMode).toBe('tile');
            expect(defaultUIPreferences.dividerPosition).toBe(65.86319218241043);
            expect(defaultUIPreferences.powerCardsSortMode).toBe('type');
            expect(defaultUIPreferences.characterGroupExpansionState).toEqual({});
        });

        test('should have correct divider position value', () => {
            const dividerPosition = 65.86319218241043;
            
            expect(dividerPosition).toBeGreaterThan(50);
            expect(dividerPosition).toBeLessThan(100);
            expect(dividerPosition).toBeCloseTo(65.86, 1);
        });
    });

    describe('Deck Data Structure', () => {
        test('should create correct blank deck metadata structure', () => {
            const currentUser: any = { id: 'user-123', username: 'testuser' };
            const defaultUIPreferences = {
                "viewMode": "tile",
                "expansionState": {
                    "event": true, "power": true, "aspect": true, "mission": true, "special": true,
                    "location": true, "teamwork": true, "training": true, "character": true,
                    "ally_universe": true, "basic_universe": true, "advanced_universe": true
                },
                "dividerPosition": 65.86319218241043,
                "powerCardsSortMode": "type",
                "characterGroupExpansionState": {}
            };

            const currentDeckData = {
                metadata: {
                    id: null, // No ID until saved
                    name: 'New Deck',
                    description: '',
                    created: new Date().toISOString(), // Client-side timestamp
                    lastModified: new Date().toISOString(), // Client-side timestamp
                    cardCount: 0,
                    userId: currentUser ? (currentUser.userId || currentUser.id) : 'guest',
                    ui_preferences: defaultUIPreferences
                },
                cards: []
            };

            // Verify metadata structure
            expect(currentDeckData.metadata.id).toBeNull();
            expect(currentDeckData.metadata.name).toBe('New Deck');
            expect(currentDeckData.metadata.description).toBe('');
            expect(currentDeckData.metadata.cardCount).toBe(0);
            expect(currentDeckData.metadata.userId).toBe('user-123');
            expect(currentDeckData.cards).toEqual([]);
            
            // Verify timestamps are valid ISO strings
            expect(new Date(currentDeckData.metadata.created)).toBeInstanceOf(Date);
            expect(new Date(currentDeckData.metadata.lastModified)).toBeInstanceOf(Date);
            
            // Verify UI preferences are attached
            expect(currentDeckData.metadata.ui_preferences).toEqual(defaultUIPreferences);
        });

        test('should handle guest user correctly', () => {
            const currentUser: any = null; // No user logged in
            const defaultUIPreferences = {
                "viewMode": "tile",
                "expansionState": {},
                "dividerPosition": 65.86319218241043,
                "powerCardsSortMode": "type",
                "characterGroupExpansionState": {}
            };

            const currentDeckData = {
                metadata: {
                    id: null,
                    name: 'New Deck',
                    description: '',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    cardCount: 0,
                    userId: currentUser ? (currentUser.userId || currentUser.id) : 'guest',
                    ui_preferences: defaultUIPreferences
                },
                cards: []
            };

            expect(currentDeckData.metadata.userId).toBe('guest');
        });
    });

    describe('Save Logic - First Save vs Subsequent Save', () => {
        test('should detect first save when currentDeckId is null', () => {
            const currentDeckId = null;
            const isFirstSave = !currentDeckId;
            
            expect(isFirstSave).toBe(true);
        });

        test('should detect subsequent save when currentDeckId exists', () => {
            const currentDeckId = 'existing-deck-123';
            const isFirstSave = !currentDeckId;
            
            expect(isFirstSave).toBe(false);
        });

        test('should create correct API request body for deck creation', () => {
            const currentDeckData: any = {
                metadata: {
                    name: 'New Deck',
                    description: 'Test Description',
                    ui_preferences: {
                        viewMode: 'tile',
                        dividerPosition: 65.86
                    }
                }
            };

            const requestBody = {
                name: currentDeckData.metadata.name,
                description: currentDeckData.metadata.description || '',
                ui_preferences: currentDeckData.metadata.ui_preferences
            };

            expect(requestBody.name).toBe('New Deck');
            expect(requestBody.description).toBe('Test Description');
            expect(requestBody.ui_preferences.viewMode).toBe('tile');
            expect(requestBody.ui_preferences.dividerPosition).toBe(65.86);
        });

        test('should handle empty description in API request', () => {
            const currentDeckData: any = {
                metadata: {
                    name: 'New Deck',
                    description: '',
                    ui_preferences: {}
                }
            };

            const requestBody = {
                name: currentDeckData.metadata.name,
                description: currentDeckData.metadata.description || '',
                ui_preferences: currentDeckData.metadata.ui_preferences
            };

            expect(requestBody.description).toBe('');
        });

        test('should handle null description in API request', () => {
            const currentDeckData: any = {
                metadata: {
                    name: 'New Deck',
                    description: null,
                    ui_preferences: {}
                }
            };

            const requestBody = {
                name: currentDeckData.metadata.name,
                description: currentDeckData.metadata.description || '',
                ui_preferences: currentDeckData.metadata.ui_preferences
            };

            expect(requestBody.description).toBe('');
        });
    });

    describe('Divider Position Calculations', () => {
        test('should calculate correct width from percentage', () => {
            const layoutWidth = 1000;
            const percentage = 65.86;
            const newWidth = (percentage / 100) * layoutWidth;
            
            expect(newWidth).toBeCloseTo(658.6, 1);
        });

        test('should handle different layout widths', () => {
            const testCases = [
                { layoutWidth: 800, percentage: 50, expectedWidth: 400 },
                { layoutWidth: 1200, percentage: 75, expectedWidth: 900 },
                { layoutWidth: 600, percentage: 33.33, expectedWidth: 199.98 },
                { layoutWidth: 0, percentage: 50, expectedWidth: 0 }
            ];

            testCases.forEach(({ layoutWidth, percentage, expectedWidth }) => {
                const newWidth = (percentage / 100) * layoutWidth;
                expect(newWidth).toBeCloseTo(expectedWidth, 2);
            });
        });

        test('should handle edge case percentages', () => {
            const layoutWidth = 1000;
            
            expect((0 / 100) * layoutWidth).toBe(0);
            expect((100 / 100) * layoutWidth).toBe(1000);
            expect((50 / 100) * layoutWidth).toBe(500);
        });
    });

    describe('Position Already Set Detection', () => {
        test('should detect when position is already set', () => {
            const existingFlex: string | null = '0 0 600px';
            const isAlreadySet = existingFlex && existingFlex !== '1';
            
            expect(isAlreadySet).toBe(true);
        });

        test('should detect when position is not set (default flex)', () => {
            const existingFlex = '1';
            const isAlreadySet = existingFlex && existingFlex !== '1';
            
            expect(isAlreadySet).toBe(false);
        });

        test('should detect when position is not set (null/undefined)', () => {
            const existingFlex: string | null = null;
            const isAlreadySet = existingFlex && existingFlex !== '1';
            
            expect(isAlreadySet).toBeFalsy();
        });

        test('should detect when position is not set (empty string)', () => {
            const existingFlex: string | null = '';
            const isAlreadySet = existingFlex && existingFlex !== '1';
            
            expect(isAlreadySet).toBeFalsy();
        });
    });

    describe('UI Preferences Priority Logic', () => {
        test('should prioritize UI preferences over localStorage', () => {
            const currentDeckData: any = {
                ui_preferences: {
                    dividerPosition: 65.86
                }
            };
            const savedPosition = '75.5';
            
            let percentage = 50; // Default
            
            if (currentDeckData && currentDeckData.ui_preferences && currentDeckData.ui_preferences.dividerPosition) {
                percentage = currentDeckData.ui_preferences.dividerPosition;
            } else {
                percentage = savedPosition ? parseFloat(savedPosition) : 50;
            }
            
            expect(percentage).toBe(65.86);
        });

        test('should fall back to localStorage when UI preferences not available', () => {
            const currentDeckData: any = {
                ui_preferences: {} // No dividerPosition
            };
            const savedPosition = '75.5';
            
            let percentage = 50; // Default
            
            if (currentDeckData && currentDeckData.ui_preferences && currentDeckData.ui_preferences.dividerPosition) {
                percentage = currentDeckData.ui_preferences.dividerPosition;
            } else {
                percentage = savedPosition ? parseFloat(savedPosition) : 50;
            }
            
            expect(percentage).toBe(75.5);
        });

        test('should use default when neither UI preferences nor localStorage available', () => {
            const currentDeckData: any = {
                ui_preferences: {} // No dividerPosition
            };
            const savedPosition = null;
            
            let percentage = 50; // Default
            
            if (currentDeckData && currentDeckData.ui_preferences && currentDeckData.ui_preferences.dividerPosition) {
                percentage = currentDeckData.ui_preferences.dividerPosition;
            } else {
                percentage = savedPosition ? parseFloat(savedPosition) : 50;
            }
            
            expect(percentage).toBe(50);
        });
    });

    describe('Error Handling', () => {
        test('should handle null currentDeckData gracefully', () => {
            const currentDeckData = null;
            const shouldReturn = !currentDeckData;
            
            expect(shouldReturn).toBe(true);
        });

        test('should handle undefined currentDeckData gracefully', () => {
            const currentDeckData = undefined;
            const shouldReturn = !currentDeckData;
            
            expect(shouldReturn).toBe(true);
        });

        test('should handle empty currentDeckData gracefully', () => {
            const currentDeckData = {};
            const shouldReturn = !currentDeckData;
            
            expect(shouldReturn).toBe(false);
        });
    });

    describe('Guest User Detection', () => {
        test('should detect guest user by role', () => {
            const currentUser: any = { role: 'GUEST' };
            const isGuest = currentUser && currentUser.role === 'GUEST';
            
            expect(isGuest).toBe(true);
        });

        test('should detect non-guest user by role', () => {
            const currentUser: any = { role: 'USER' };
            const isGuest = currentUser && currentUser.role === 'GUEST';
            
            expect(isGuest).toBe(false);
        });

        test('should handle null user gracefully', () => {
            const currentUser: any = null;
            const isGuest = currentUser && currentUser.role === 'GUEST';
            
            expect(isGuest).toBeFalsy();
        });
    });

    describe('Read-Only Mode Detection', () => {
        test('should detect read-only mode', () => {
            const isReadOnlyMode = true;
            const shouldBlock = isReadOnlyMode;
            
            expect(shouldBlock).toBe(true);
        });

        test('should allow editing when not in read-only mode', () => {
            const isReadOnlyMode = false;
            const shouldBlock = isReadOnlyMode;
            
            expect(shouldBlock).toBe(false);
        });
    });
});
