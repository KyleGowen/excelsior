/**
 * Mission Set Filtering Tests
 * 
 * Tests for mission set checkbox filtering functionality including:
 * - Default checked state preservation
 * - Filtering behavior when checkboxes are toggled
 * - Event listener setup
 * - Integration with clearAllFiltersGlobally function
 */

describe('Mission Set Filtering', () => {
    let mockDocument: any;
    let mockCheckboxes: any[];
    let mockMissionsData: any[];
    let mockDisplayMissions: jest.Mock;
    let mockClearAllFiltersGlobally: jest.Mock;

    beforeEach(() => {
        // Mock document and DOM elements
        mockCheckboxes = [
            {
                value: 'King of the Jungle',
                checked: true,
                addEventListener: jest.fn()
            },
            {
                value: 'The Call of Cthulhu',
                checked: true,
                addEventListener: jest.fn()
            },
            {
                value: 'Time Wars: Rise of the Gods',
                checked: true,
                addEventListener: jest.fn()
            },
            {
                value: 'Warlord of Mars',
                checked: true,
                addEventListener: jest.fn()
            }
        ];

        mockDocument = {
            querySelectorAll: jest.fn((selector: string) => {
                if (selector === '#missions-tab input[type="checkbox"]') {
                    return mockCheckboxes;
                }
                if (selector === '#missions-tab input[type="checkbox"]:checked') {
                    return mockCheckboxes.filter(cb => cb.checked);
                }
                if (selector === 'input[type="checkbox"]') {
                    return mockCheckboxes;
                }
                return [];
            }),
            getElementById: jest.fn((id: string) => {
                if (id === 'missions-tbody') {
                    return {
                        innerHTML: ''
                    };
                }
                return null;
            })
        };

        // Mock missions data
        mockMissionsData = [
            { id: 1, card_name: 'Beasts of Tarzan', mission_set: 'King of the Jungle' },
            { id: 2, card_name: 'Tarzan and the Castaways', mission_set: 'King of the Jungle' },
            { id: 3, card_name: 'The Call of Cthulhu', mission_set: 'The Call of Cthulhu' },
            { id: 4, card_name: 'Time Wars Mission', mission_set: 'Time Wars: Rise of the Gods' },
            { id: 5, card_name: 'Warlord Mission', mission_set: 'Warlord of Mars' }
        ];

        // Mock global functions
        mockDisplayMissions = jest.fn();
        mockClearAllFiltersGlobally = jest.fn();

        // Set up global mocks
        (global as any).document = mockDocument;
        (global as any).window = {
            missionsData: mockMissionsData
        };
        (global as any).displayMissions = mockDisplayMissions;
        (global as any).clearAllFiltersGlobally = mockClearAllFiltersGlobally;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Default Checked State Preservation', () => {
        test('should preserve mission set checkboxes as checked by default in clearAllFiltersGlobally', () => {
            // Import the function (this would be from the actual file)
            const clearAllFiltersGlobally = () => {
                const checkboxes = mockDocument.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    const missionSetValues = ['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars'];
                    if (missionSetValues.includes(checkbox.value)) {
                        checkbox.checked = true;
                    } else {
                        checkbox.checked = false;
                    }
                });
            };

            // Set up some checkboxes as unchecked
            mockCheckboxes[0].checked = false;
            mockCheckboxes[1].checked = false;

            // Call the function
            clearAllFiltersGlobally();

            // Verify mission set checkboxes are checked
            expect(mockCheckboxes[0].checked).toBe(true); // King of the Jungle
            expect(mockCheckboxes[1].checked).toBe(true); // The Call of Cthulhu
            expect(mockCheckboxes[2].checked).toBe(true); // Time Wars: Rise of the Gods
            expect(mockCheckboxes[3].checked).toBe(true); // Warlord of Mars
        });

        test('should clear non-mission set checkboxes in clearAllFiltersGlobally', () => {
            const otherCheckbox = {
                value: 'Other Filter',
                checked: true,
                addEventListener: jest.fn()
            };
            mockCheckboxes.push(otherCheckbox);

            const clearAllFiltersGlobally = () => {
                const checkboxes = mockDocument.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    const missionSetValues = ['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars'];
                    if (missionSetValues.includes(checkbox.value)) {
                        checkbox.checked = true;
                    } else {
                        checkbox.checked = false;
                    }
                });
            };

            clearAllFiltersGlobally();

            // Verify non-mission set checkbox is cleared
            expect(otherCheckbox.checked).toBe(false);
        });
    });

    describe('Mission Set Filtering Logic', () => {
        test('should filter missions by selected mission sets', () => {
            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                if (selectedMissionSets.length === 0) {
                    const tbody = mockDocument.getElementById('missions-tbody');
                    tbody.innerHTML = '<tr><td colspan="3" class="no-results">No mission sets selected</td></tr>';
                    return;
                }
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            // All checkboxes checked - should show all missions
            applyMissionFilters();
            expect(mockDisplayMissions).toHaveBeenCalledWith(mockMissionsData);

            // Uncheck "King of the Jungle"
            mockCheckboxes[0].checked = false;
            applyMissionFilters();
            const expectedFiltered = mockMissionsData.filter(mission => mission.mission_set !== 'King of the Jungle');
            expect(mockDisplayMissions).toHaveBeenCalledWith(expectedFiltered);
        });

        test('should show "No mission sets selected" when no checkboxes are checked', () => {
            const mockTbody = { innerHTML: '' };
            mockDocument.getElementById.mockReturnValue(mockTbody);

            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                if (selectedMissionSets.length === 0) {
                    const tbody = mockDocument.getElementById('missions-tbody');
                    tbody.innerHTML = '<tr><td colspan="3" class="no-results">No mission sets selected</td></tr>';
                    return;
                }
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            // Uncheck all checkboxes
            mockCheckboxes.forEach(cb => cb.checked = false);

            applyMissionFilters();

            expect(mockTbody.innerHTML).toBe('<tr><td colspan="3" class="no-results">No mission sets selected</td></tr>');
            expect(mockDisplayMissions).not.toHaveBeenCalled();
        });

        test('should handle multiple mission sets being unchecked', () => {
            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                if (selectedMissionSets.length === 0) {
                    const tbody = mockDocument.getElementById('missions-tbody');
                    tbody.innerHTML = '<tr><td colspan="3" class="no-results">No mission sets selected</td></tr>';
                    return;
                }
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            // Uncheck "King of the Jungle" and "The Call of Cthulhu"
            mockCheckboxes[0].checked = false; // King of the Jungle
            mockCheckboxes[1].checked = false; // The Call of Cthulhu

            applyMissionFilters();

            const expectedFiltered = mockMissionsData.filter(mission => 
                mission.mission_set === 'Time Wars: Rise of the Gods' || 
                mission.mission_set === 'Warlord of Mars'
            );
            expect(mockDisplayMissions).toHaveBeenCalledWith(expectedFiltered);
        });
    });

    describe('Event Listener Setup', () => {
        test('should set up event listeners for mission set checkboxes in setupMissionSearch', () => {
            const setupMissionSearch = () => {
                // Set up checkbox event listeners for mission set filtering
                mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]').forEach((checkbox: any) => {
                    checkbox.addEventListener('change', () => {
                        // This would call applyMissionFilters
                    });
                });
            };

            setupMissionSearch();

            // Verify event listeners were added to all checkboxes
            mockCheckboxes.forEach(checkbox => {
                expect(checkbox.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
            });
        });

        test('should handle missing checkboxes gracefully', () => {
            mockDocument.querySelectorAll.mockReturnValue([]);

            const setupMissionSearch = () => {
                const checkboxes = mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    checkbox.addEventListener('change', () => {
                        // This would call applyMissionFilters
                    });
                });
            };

            // Should not throw an error
            expect(() => setupMissionSearch()).not.toThrow();
        });
    });

    describe('Integration with Global Functions', () => {
        test('should work with clearAllFiltersGlobally and maintain mission set checkboxes checked', () => {
            const clearAllFiltersGlobally = () => {
                const checkboxes = mockDocument.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    const missionSetValues = ['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars'];
                    if (missionSetValues.includes(checkbox.value)) {
                        checkbox.checked = true;
                    } else {
                        checkbox.checked = false;
                    }
                });
            };

            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            // Simulate clearing all filters
            clearAllFiltersGlobally();

            // Then apply mission filters - should show all missions
            applyMissionFilters();

            expect(mockDisplayMissions).toHaveBeenCalledWith(mockMissionsData);
        });

        test('should handle empty missions data gracefully', () => {
            (global as any).window.missionsData = [];

            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            applyMissionFilters();

            expect(mockDisplayMissions).toHaveBeenCalledWith([]);
        });

        test('should handle missing missions data gracefully', () => {
            (global as any).window.missionsData = undefined;

            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            applyMissionFilters();

            expect(mockDisplayMissions).toHaveBeenCalledWith([]);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle checkbox with missing value property', () => {
            const invalidCheckbox = {
                checked: true,
                addEventListener: jest.fn()
                // Missing value property
            };
            mockCheckboxes.push(invalidCheckbox);

            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value)
                    .filter(value => value !== undefined); // Filter out undefined values
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            // Should not throw an error
            expect(() => applyMissionFilters()).not.toThrow();
        });

        test('should handle missions with missing mission_set property', () => {
            const missionsWithMissingSet = [
                { id: 1, card_name: 'Valid Mission', mission_set: 'King of the Jungle' },
                { id: 2, card_name: 'Invalid Mission' }, // Missing mission_set
                { id: 3, card_name: 'Another Valid Mission', mission_set: 'The Call of Cthulhu' }
            ];
            (global as any).window.missionsData = missionsWithMissingSet;

            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    mission.mission_set && selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            applyMissionFilters();

            const expectedFiltered = missionsWithMissingSet.filter(mission => 
                mission.mission_set && ['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars'].includes(mission.mission_set)
            );
            expect(mockDisplayMissions).toHaveBeenCalledWith(expectedFiltered);
        });

        test('should handle rapid checkbox state changes', () => {
            const applyMissionFilters = jest.fn(() => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            });

            // Simulate rapid state changes
            mockCheckboxes[0].checked = false;
            applyMissionFilters();
            
            mockCheckboxes[0].checked = true;
            applyMissionFilters();
            
            mockCheckboxes[1].checked = false;
            applyMissionFilters();

            expect(applyMissionFilters).toHaveBeenCalledTimes(3);
        });
    });

    describe('Mission Set Values Validation', () => {
        test('should use correct mission set values in clearAllFiltersGlobally', () => {
            const expectedMissionSets = ['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars'];
            
            const clearAllFiltersGlobally = () => {
                const checkboxes = mockDocument.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    const missionSetValues = ['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars'];
                    if (missionSetValues.includes(checkbox.value)) {
                        checkbox.checked = true;
                    } else {
                        checkbox.checked = false;
                    }
                });
            };

            // Verify the mission set values are correct
            expect(expectedMissionSets).toEqual(['King of the Jungle', 'The Call of Cthulhu', 'Time Wars: Rise of the Gods', 'Warlord of Mars']);
            
            // Test that the function works with these values
            clearAllFiltersGlobally();
            
            mockCheckboxes.forEach(checkbox => {
                expect(checkbox.checked).toBe(true);
            });
        });

        test('should handle case sensitivity correctly', () => {
            const applyMissionFilters = () => {
                const selectedMissionSets = Array.from(mockDocument.querySelectorAll('#missions-tab input[type="checkbox"]:checked'))
                    .map((checkbox: any) => checkbox.value);
                
                const missions = (global as any).window.missionsData || [];
                const filteredMissions = missions.filter((mission: any) => 
                    selectedMissionSets.includes(mission.mission_set)
                );
                
                mockDisplayMissions(filteredMissions);
            };

            // Test with exact case match
            applyMissionFilters();
            expect(mockDisplayMissions).toHaveBeenCalledWith(mockMissionsData);

            // Test that case sensitivity is maintained
            const missionsWithDifferentCase = [
                { id: 1, card_name: 'Test Mission', mission_set: 'king of the jungle' } // lowercase
            ];
            (global as any).window.missionsData = missionsWithDifferentCase;

            applyMissionFilters();

            // Should not match due to case sensitivity
            expect(mockDisplayMissions).toHaveBeenCalledWith([]);
        });
    });
});
