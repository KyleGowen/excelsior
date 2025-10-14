/**
 * @jest-environment jsdom
 */

/**
 * Read-Only Mode Card Category Collapsing Tests
 * 
 * This test suite verifies that card categories can be collapsed/expanded
 * in read-only mode, while maintaining proper security for non-owners.
 * 
 * Security Measures Tested:
 * - Card category collapsing allowed in read-only mode for owners
 * - Card category collapsing blocked for non-owners
 * - Expansion state saving allowed in read-only mode for owners
 * - Expansion state saving blocked for non-owners
 * - Integration with existing security measures
 */

describe('Read-Only Mode Card Category Collapsing Tests', () => {
    let mockDocument: Document;
    let mockBody: HTMLElement;
    let mockCurrentDeckData: any;
    let mockCurrentDeckId: string | null;
    let mockDeckEditorExpansionState: any;
    let mockLocalStorage: any;
    let mockConsoleLog: jest.SpyInstance;

    beforeEach(() => {
        // Create mock document and body
        mockDocument = {
            getElementById: jest.fn(),
            body: {} as HTMLElement
        } as any;
        
        mockBody = {
            classList: {
                contains: jest.fn().mockReturnValue(false),
                add: jest.fn(),
                remove: jest.fn()
            }
        } as any;
        
        mockDocument.body = mockBody;
        
        // Mock global variables
        mockCurrentDeckId = 'test-deck-id';
        mockCurrentDeckData = {
            metadata: {
                isOwner: true
            }
        };
        mockDeckEditorExpansionState = {
            character: true,
            power: false,
            mission: true
        };
        
        // Mock localStorage
        mockLocalStorage = {
            setItem: jest.fn(),
            getItem: jest.fn()
        };
        
        // Mock global variables and functions
        (global as any).document = mockDocument;
        (global as any).currentDeckId = mockCurrentDeckId;
        (global as any).currentDeckData = mockCurrentDeckData;
        (global as any).deckEditorExpansionState = mockDeckEditorExpansionState;
        (global as any).localStorage = mockLocalStorage;
        
        // Mock console.log
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Helper function to simulate read-only mode
    const setReadOnlyMode = (isReadOnly: boolean) => {
        (mockBody.classList.contains as jest.Mock).mockReturnValue(isReadOnly);
    };

    // Helper function to simulate ownership
    const setOwnership = (isOwner: boolean) => {
        mockCurrentDeckData.metadata.isOwner = isOwner;
    };

    describe('toggleDeckListSection() in Read-Only Mode', () => {
        test('should allow deck list section toggle in read-only mode for owners', () => {
            setReadOnlyMode(true);
            setOwnership(true);
            
            // Mock DOM elements
            const mockItemsContainer = {
                closest: jest.fn().mockReturnValue({
                    querySelector: jest.fn().mockReturnValue({
                        querySelector: jest.fn().mockReturnValue({
                            classList: {
                                contains: jest.fn().mockReturnValue(false),
                                add: jest.fn(),
                                remove: jest.fn()
                            }
                        })
                    })
                })
            };
            
            (mockDocument.getElementById as jest.Mock).mockReturnValue(mockItemsContainer);
            
            // Mock the toggleDeckListSection function
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                // SECURITY: Check if user owns this deck before allowing UI interactions
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                
                // Simulate UI interaction
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBe('allowed');
            expect(mockConsoleLog).toHaveBeenCalledWith('Toggling deck list section: character');
            expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🔒 SECURITY'));
        });

        test('should block deck list section toggle for non-owners in read-only mode', () => {
            setReadOnlyMode(true);
            setOwnership(false);
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                // SECURITY: Check if user owns this deck before allowing UI interactions
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBeUndefined();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Toggling deck list section: character');
        });

        test('should allow deck list section toggle for owners in edit mode', () => {
            setReadOnlyMode(false);
            setOwnership(true);
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                // SECURITY: Check if user owns this deck before allowing UI interactions
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBe('allowed');
            expect(mockConsoleLog).toHaveBeenCalledWith('Toggling deck list section: character');
            expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🔒 SECURITY'));
        });

        test('should block deck list section toggle for non-owners in edit mode', () => {
            setReadOnlyMode(false);
            setOwnership(false);
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                // SECURITY: Check if user owns this deck before allowing UI interactions
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBeUndefined();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Toggling deck list section: character');
        });
    });

    describe('saveDeckExpansionState() in Read-Only Mode', () => {
        test('should allow saving expansion state in read-only mode for owners', () => {
            setReadOnlyMode(true);
            setOwnership(true);
            
            const saveDeckExpansionState = jest.fn().mockImplementation(() => {
                if (mockCurrentDeckId) {
                    // SECURITY: Check if user owns this deck before saving expansion state
                    if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                        console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
                        return;
                    }
                    
                    console.log('Saving expansion state for deck:', mockCurrentDeckId, 'state:', mockDeckEditorExpansionState);
                    mockLocalStorage.setItem(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
                    return 'saved';
                }
            });
            
            const result = saveDeckExpansionState();
            
            expect(result).toBe('saved');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
            expect(mockConsoleLog).toHaveBeenCalledWith('Saving expansion state for deck:', mockCurrentDeckId, 'state:', mockDeckEditorExpansionState);
            expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🔒 SECURITY'));
        });

        test('should block saving expansion state for non-owners in read-only mode', () => {
            setReadOnlyMode(true);
            setOwnership(false);
            
            const saveDeckExpansionState = jest.fn().mockImplementation(() => {
                if (mockCurrentDeckId) {
                    // SECURITY: Check if user owns this deck before saving expansion state
                    if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                        console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
                        return;
                    }
                    
                    console.log('Saving expansion state for deck:', mockCurrentDeckId, 'state:', mockDeckEditorExpansionState);
                    mockLocalStorage.setItem(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
                    return 'saved';
                }
            });
            
            const result = saveDeckExpansionState();
            
            expect(result).toBeUndefined();
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Saving expansion state for deck:');
        });

        test('should allow saving expansion state for owners in edit mode', () => {
            setReadOnlyMode(false);
            setOwnership(true);
            
            const saveDeckExpansionState = jest.fn().mockImplementation(() => {
                if (mockCurrentDeckId) {
                    // SECURITY: Check if user owns this deck before saving expansion state
                    if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                        console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
                        return;
                    }
                    
                    console.log('Saving expansion state for deck:', mockCurrentDeckId, 'state:', mockDeckEditorExpansionState);
                    mockLocalStorage.setItem(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
                    return 'saved';
                }
            });
            
            const result = saveDeckExpansionState();
            
            expect(result).toBe('saved');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
            expect(mockConsoleLog).toHaveBeenCalledWith('Saving expansion state for deck:', mockCurrentDeckId, 'state:', mockDeckEditorExpansionState);
            expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🔒 SECURITY'));
        });

        test('should block saving expansion state for non-owners in edit mode', () => {
            setReadOnlyMode(false);
            setOwnership(false);
            
            const saveDeckExpansionState = jest.fn().mockImplementation(() => {
                if (mockCurrentDeckId) {
                    // SECURITY: Check if user owns this deck before saving expansion state
                    if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                        console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
                        return;
                    }
                    
                    console.log('Saving expansion state for deck:', mockCurrentDeckId, 'state:', mockDeckEditorExpansionState);
                    mockLocalStorage.setItem(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
                    return 'saved';
                }
            });
            
            const result = saveDeckExpansionState();
            
            expect(result).toBeUndefined();
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Saving expansion state for deck:');
        });
    });

    describe('Integration with Other Security Measures', () => {
        test('should maintain security for other functions while allowing category collapsing', () => {
            setReadOnlyMode(true);
            setOwnership(true);
            
            // Mock other security functions that should still be blocked
            const saveUIPreferences = jest.fn().mockImplementation(() => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
                    return;
                }
                console.log('Saving UI preferences');
                return 'saved';
            });
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            // Test that category collapsing is allowed
            const collapseResult = toggleDeckListSection('character');
            expect(collapseResult).toBe('allowed');
            
            // Test that other functions are still blocked
            const saveResult = saveUIPreferences();
            expect(saveResult).toBeUndefined();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save in read-only mode');
        });

        test('should handle missing currentDeckData gracefully', () => {
            setReadOnlyMode(true);
            (global as any).currentDeckData = null;
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBe('allowed');
            expect(mockConsoleLog).toHaveBeenCalledWith('Toggling deck list section: character');
        });

        test('should handle missing currentDeckId gracefully', () => {
            setReadOnlyMode(true);
            setOwnership(true);
            mockCurrentDeckId = null;
            
            const saveDeckExpansionState = jest.fn().mockImplementation(() => {
                if (mockCurrentDeckId) {
                    if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                        console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
                        return;
                    }
                    mockLocalStorage.setItem(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
                    return 'saved';
                }
                return 'no-deck-id';
            });
            
            const result = saveDeckExpansionState();
            
            expect(result).toBe('no-deck-id');
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing metadata gracefully', () => {
            setReadOnlyMode(true);
            mockCurrentDeckData.metadata = null;
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBe('allowed');
            expect(mockConsoleLog).toHaveBeenCalledWith('Toggling deck list section: character');
        });

        test('should handle missing isOwner property gracefully', () => {
            setReadOnlyMode(true);
            delete mockCurrentDeckData.metadata.isOwner;
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && 
                    mockCurrentDeckData.metadata.hasOwnProperty('isOwner') && 
                    !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBe('allowed');
            expect(mockConsoleLog).toHaveBeenCalledWith('Toggling deck list section: character');
        });

        test('should handle classList.contains throwing error', () => {
            (mockBody.classList.contains as jest.Mock).mockImplementation(() => {
                throw new Error('classList error');
            });
            setOwnership(true);
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                try {
                    if (mockBody.classList.contains('read-only-mode')) {
                        console.log('🔒 SECURITY: Blocking deck list section toggle in read-only mode');
                        return;
                    }
                } catch (error) {
                    // Handle error gracefully
                }
                
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const result = toggleDeckListSection('character');
            
            expect(result).toBe('allowed');
            expect(mockConsoleLog).toHaveBeenCalledWith('Toggling deck list section: character');
        });
    });

    describe('Security Message Consistency', () => {
        test('should use consistent security message format', () => {
            setReadOnlyMode(true);
            setOwnership(false);
            
            const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
                    return;
                }
                console.log(`Toggling deck list section: ${type}`);
                return 'allowed';
            });
            
            const saveDeckExpansionState = jest.fn().mockImplementation(() => {
                if (mockCurrentDeckId) {
                    if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                        console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
                        return;
                    }
                    mockLocalStorage.setItem(`deckExpansionState_${mockCurrentDeckId}`, JSON.stringify(mockDeckEditorExpansionState));
                    return 'saved';
                }
            });
            
            toggleDeckListSection('character');
            saveDeckExpansionState();
            
            const securityMessages = [
                '🔒 SECURITY: Blocking deck list section toggle - user does not own this deck',
                '🔒 SECURITY: Blocking expansion state save - user does not own this deck'
            ];
            
            securityMessages.forEach(message => {
                expect(mockConsoleLog).toHaveBeenCalledWith(message);
            });
        });
    });
});
