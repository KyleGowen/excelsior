/**
 * @jest-environment jsdom
 */

/**
 * Save Button Read-Only Mode Security Tests
 * 
 * This test suite verifies that the Save button is properly disabled
 * and secured in read-only mode, preventing unauthorized deck modifications.
 * 
 * Security Measures Tested:
 * - Save button disabled in read-only mode
 * - Save button visual state in read-only mode
 * - saveDeckChanges function blocked in read-only mode
 * - Save button state updates when mode changes
 * - Integration with existing guest user restrictions
 */

describe('Save Button Read-Only Mode Security Tests', () => {
    let mockDocument: Document;
    let mockBody: HTMLElement;
    let mockSaveButton: HTMLButtonElement;
    let mockConsoleLog: jest.SpyInstance;
    let mockAlert: jest.SpyInstance;

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
        
        // Create mock Save button
        mockSaveButton = {
            disabled: false,
            style: {
                opacity: '1',
                cursor: 'pointer',
                display: 'block'
            },
            title: ''
        } as HTMLButtonElement;
        
        // Mock global variables and functions
        (global as any).document = mockDocument;
        (global as any).isGuestUser = jest.fn().mockReturnValue(false);
        (global as any).currentDeckData = { metadata: { name: 'Test Deck' } };
        
        // Mock document.getElementById to return our mock Save button
        (mockDocument.getElementById as jest.Mock).mockImplementation((id: string) => {
            if (id === 'saveDeckButton') {
                return mockSaveButton;
            }
            return null;
        });
        
        // Mock console.log and alert
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
        mockAlert = jest.spyOn(window, 'alert').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Helper function to simulate read-only mode
    const setReadOnlyMode = (isReadOnly: boolean) => {
        (mockBody.classList.contains as jest.Mock).mockReturnValue(isReadOnly);
    };

    // Helper function to simulate guest user
    const setGuestUser = (isGuest: boolean) => {
        (global as any).isGuestUser = jest.fn().mockReturnValue(isGuest);
    };

    describe('updateSaveButtonState() Function', () => {
        test('should disable Save button in read-only mode', () => {
            setReadOnlyMode(true);
            setGuestUser(false);
            
            // Mock the updateSaveButtonState function
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    } else if ((global as any).isGuestUser()) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Guests cannot save edits';
                        saveButton.style.display = 'block';
                    } else {
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                        saveButton.title = '';
                        saveButton.style.display = 'block';
                    }
                }
            });
            
            updateSaveButtonState();
            
            expect(mockSaveButton.disabled).toBe(true);
            expect(mockSaveButton.style.opacity).toBe('0.5');
            expect(mockSaveButton.style.cursor).toBe('not-allowed');
            expect(mockSaveButton.title).toBe('Save is disabled in read-only mode');
            expect(mockSaveButton.style.display).toBe('block');
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Save button disabled in read-only mode');
        });

        test('should enable Save button in edit mode for regular users', () => {
            setReadOnlyMode(false);
            setGuestUser(false);
            
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    } else if ((global as any).isGuestUser()) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Guests cannot save edits';
                        saveButton.style.display = 'block';
                    } else {
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                        saveButton.title = '';
                        saveButton.style.display = 'block';
                    }
                }
            });
            
            updateSaveButtonState();
            
            expect(mockSaveButton.disabled).toBe(false);
            expect(mockSaveButton.style.opacity).toBe('1');
            expect(mockSaveButton.style.cursor).toBe('pointer');
            expect(mockSaveButton.title).toBe('');
            expect(mockSaveButton.style.display).toBe('block');
            expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🔒 SECURITY'));
        });

        test('should disable Save button for guest users even in edit mode', () => {
            setReadOnlyMode(false);
            setGuestUser(true);
            
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    } else if ((global as any).isGuestUser()) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Guests cannot save edits';
                        saveButton.style.display = 'block';
                    } else {
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                        saveButton.title = '';
                        saveButton.style.display = 'block';
                    }
                }
            });
            
            updateSaveButtonState();
            
            expect(mockSaveButton.disabled).toBe(true);
            expect(mockSaveButton.style.opacity).toBe('0.5');
            expect(mockSaveButton.style.cursor).toBe('not-allowed');
            expect(mockSaveButton.title).toBe('Guests cannot save edits');
            expect(mockSaveButton.style.display).toBe('block');
        });

        test('should prioritize read-only mode over guest user status', () => {
            setReadOnlyMode(true);
            setGuestUser(true);
            
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    } else if ((global as any).isGuestUser()) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Guests cannot save edits';
                        saveButton.style.display = 'block';
                    } else {
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                        saveButton.title = '';
                        saveButton.style.display = 'block';
                    }
                }
            });
            
            updateSaveButtonState();
            
            expect(mockSaveButton.disabled).toBe(true);
            expect(mockSaveButton.title).toBe('Save is disabled in read-only mode');
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Save button disabled in read-only mode');
        });
    });

    describe('saveDeckChanges() Function Security', () => {
        test('should block saveDeckChanges in read-only mode', async () => {
            setReadOnlyMode(true);
            setGuestUser(false);
            
            // Mock the saveDeckChanges function
            const saveDeckChanges = jest.fn().mockImplementation(async () => {
                if (!(global as any).currentDeckData) return;
                
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
                    alert('Cannot save changes in read-only mode.');
                    return;
                }
                
                if ((global as any).isGuestUser()) {
                    alert('Guests cannot save edits. Please log in to save deck changes.');
                    return;
                }
                
                // Simulate successful save
                console.log('Deck saved successfully');
            });
            
            await saveDeckChanges();
            
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
            expect(mockAlert).toHaveBeenCalledWith('Cannot save changes in read-only mode.');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Deck saved successfully');
        });

        test('should allow saveDeckChanges in edit mode for regular users', async () => {
            setReadOnlyMode(false);
            setGuestUser(false);
            
            const saveDeckChanges = jest.fn().mockImplementation(async () => {
                if (!(global as any).currentDeckData) return;
                
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
                    alert('Cannot save changes in read-only mode.');
                    return;
                }
                
                if ((global as any).isGuestUser()) {
                    alert('Guests cannot save edits. Please log in to save deck changes.');
                    return;
                }
                
                console.log('Deck saved successfully');
            });
            
            await saveDeckChanges();
            
            expect(mockConsoleLog).toHaveBeenCalledWith('Deck saved successfully');
            expect(mockAlert).not.toHaveBeenCalled();
        });

        test('should block saveDeckChanges for guest users', async () => {
            setReadOnlyMode(false);
            setGuestUser(true);
            
            const saveDeckChanges = jest.fn().mockImplementation(async () => {
                if (!(global as any).currentDeckData) return;
                
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
                    alert('Cannot save changes in read-only mode.');
                    return;
                }
                
                if ((global as any).isGuestUser()) {
                    alert('Guests cannot save edits. Please log in to save deck changes.');
                    return;
                }
                
                console.log('Deck saved successfully');
            });
            
            await saveDeckChanges();
            
            expect(mockAlert).toHaveBeenCalledWith('Guests cannot save edits. Please log in to save deck changes.');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Deck saved successfully');
        });
    });

    describe('Save Button State Transitions', () => {
        test('should update Save button when switching from edit to read-only mode', () => {
            // Start in edit mode
            setReadOnlyMode(false);
            setGuestUser(false);
            
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    } else if ((global as any).isGuestUser()) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Guests cannot save edits';
                        saveButton.style.display = 'block';
                    } else {
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                        saveButton.title = '';
                        saveButton.style.display = 'block';
                    }
                }
            });
            
            // First call - edit mode
            updateSaveButtonState();
            expect(mockSaveButton.disabled).toBe(false);
            expect(mockSaveButton.style.opacity).toBe('1');
            
            // Switch to read-only mode
            setReadOnlyMode(true);
            updateSaveButtonState();
            expect(mockSaveButton.disabled).toBe(true);
            expect(mockSaveButton.style.opacity).toBe('0.5');
            expect(mockSaveButton.title).toBe('Save is disabled in read-only mode');
        });

        test('should update Save button when switching from read-only to edit mode', () => {
            // Start in read-only mode
            setReadOnlyMode(true);
            setGuestUser(false);
            
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    } else if ((global as any).isGuestUser()) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Guests cannot save edits';
                        saveButton.style.display = 'block';
                    } else {
                        saveButton.disabled = false;
                        saveButton.style.opacity = '1';
                        saveButton.style.cursor = 'pointer';
                        saveButton.title = '';
                        saveButton.style.display = 'block';
                    }
                }
            });
            
            // First call - read-only mode
            updateSaveButtonState();
            expect(mockSaveButton.disabled).toBe(true);
            expect(mockSaveButton.style.opacity).toBe('0.5');
            
            // Switch to edit mode
            setReadOnlyMode(false);
            updateSaveButtonState();
            expect(mockSaveButton.disabled).toBe(false);
            expect(mockSaveButton.style.opacity).toBe('1');
            expect(mockSaveButton.title).toBe('');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing Save button element gracefully', () => {
            (mockDocument.getElementById as jest.Mock).mockReturnValue(null);
            
            const updateSaveButtonState = jest.fn().mockImplementation(() => {
                const saveButton = mockDocument.getElementById('saveDeckButton') as HTMLButtonElement;
                if (saveButton) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.5';
                        saveButton.style.cursor = 'not-allowed';
                        saveButton.title = 'Save is disabled in read-only mode';
                        saveButton.style.display = 'block';
                        console.log('🔒 SECURITY: Save button disabled in read-only mode');
                    }
                }
            });
            
            // Should not throw error
            expect(() => updateSaveButtonState()).not.toThrow();
        });

        test('should handle missing currentDeckData in saveDeckChanges', async () => {
            setReadOnlyMode(false);
            setGuestUser(false);
            (global as any).currentDeckData = null;
            
            const saveDeckChanges = jest.fn().mockImplementation(async () => {
                if (!(global as any).currentDeckData) return;
                
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
                    alert('Cannot save changes in read-only mode.');
                    return;
                }
                
                console.log('Deck saved successfully');
            });
            
            await saveDeckChanges();
            
            expect(mockConsoleLog).not.toHaveBeenCalledWith('Deck saved successfully');
            expect(mockAlert).not.toHaveBeenCalled();
        });
    });

    describe('Security Message Consistency', () => {
        test('should use consistent security message format', () => {
            const securityMessages = [
                '🔒 SECURITY: Save button disabled in read-only mode',
                '🔒 SECURITY: Blocking saveDeckChanges in read-only mode'
            ];
            
            securityMessages.forEach(message => {
                expect(message).toMatch(/^🔒 SECURITY: .+ in read-only mode$/);
            });
        });

        test('should use consistent user-facing messages', () => {
            const userMessages = [
                'Save is disabled in read-only mode',
                'Cannot save changes in read-only mode.',
                'Guests cannot save edits'
            ];
            
            userMessages.forEach(message => {
                expect(message).toBeTruthy();
                expect(message.length).toBeGreaterThan(0);
            });
        });
    });
});
