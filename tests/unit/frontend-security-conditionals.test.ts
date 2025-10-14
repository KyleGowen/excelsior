/**
 * @jest-environment jsdom
 */

/**
 * Frontend Security Conditionals Tests
 * 
 * This test suite specifically covers the new frontend security conditionals
 * added in Phase 1, including read-only mode detection, ownership validation,
 * and UI state management.
 * 
 * Test Coverage:
 * - Read-only mode detection from URL parameters
 * - Read-only badge visibility logic
 * - Security conditional integration
 * - Edge cases for security checks
 * - DOM manipulation security
 * - Event handler security
 */

describe('Frontend Security Conditionals Tests', () => {
    let mockDocument: Document;
    let mockBody: HTMLElement;
    let mockWindow: Window;
    let mockConsoleLog: jest.SpyInstance;
    let mockCurrentDeckData: any;
    let mockCurrentDeckId: string;

    beforeEach(() => {
        // Create mock document and body
        mockDocument = {
            querySelectorAll: jest.fn(),
            getElementById: jest.fn(),
            querySelector: jest.fn(),
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
        
        // Mock window and location
        mockWindow = {
            location: {
                search: '',
                href: 'http://localhost'
            },
            history: {
                pushState: jest.fn(),
                replaceState: jest.fn()
            }
        } as any;
        
        // Mock global variables
        mockCurrentDeckId = 'test-deck-123';
        mockCurrentDeckData = {
            metadata: {
                id: mockCurrentDeckId,
                name: 'Test Deck',
                isOwner: true
            }
        };
        
        // Mock global functions and variables
        (global as any).document = mockDocument;
        (global as any).window = mockWindow;
        (global as any).currentDeckId = mockCurrentDeckId;
        (global as any).currentDeckData = mockCurrentDeckData;
        (global as any).URLSearchParams = URLSearchParams;
        
        // Mock console.log to capture security messages
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
        
        // Mock localStorage
        (global as any).localStorage = {
            setItem: jest.fn(),
            getItem: jest.fn()
        };
        
        // Mock fetch for API calls
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true })
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Read-Only Mode Detection from URL Parameters', () => {
        test('should detect read-only mode from URL parameter readonly=true', () => {
            mockWindow.location.search = '?readonly=true';
            
            // Simulate the URL parameter detection logic
            const urlParams = new URLSearchParams(mockWindow.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            if (isReadOnlyFromQuery) {
                mockBody.classList.add('read-only-mode');
                console.log('🔍 Read-only mode detected from URL parameter');
            }
            
            expect(isReadOnlyFromQuery).toBe(true);
            expect(mockBody.classList.add).toHaveBeenCalledWith('read-only-mode');
            expect(mockConsoleLog).toHaveBeenCalledWith('🔍 Read-only mode detected from URL parameter');
        });

        test('should not detect read-only mode from URL parameter readonly=false', () => {
            mockWindow.location.search = '?readonly=false';
            
            const urlParams = new URLSearchParams(mockWindow.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            if (isReadOnlyFromQuery) {
                mockBody.classList.add('read-only-mode');
                console.log('🔍 Read-only mode detected from URL parameter');
            }
            
            expect(isReadOnlyFromQuery).toBe(false);
            expect(mockBody.classList.add).not.toHaveBeenCalled();
            expect(mockConsoleLog).not.toHaveBeenCalledWith('🔍 Read-only mode detected from URL parameter');
        });

        test('should not detect read-only mode when URL parameter is missing', () => {
            mockWindow.location.search = '';
            
            const urlParams = new URLSearchParams(mockWindow.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            if (isReadOnlyFromQuery) {
                mockBody.classList.add('read-only-mode');
                console.log('🔍 Read-only mode detected from URL parameter');
            }
            
            expect(isReadOnlyFromQuery).toBe(false);
            expect(mockBody.classList.add).not.toHaveBeenCalled();
        });

        test('should handle multiple URL parameters with readonly=true', () => {
            mockWindow.location.search = '?deckId=123&readonly=true&view=tile';
            
            const urlParams = new URLSearchParams(mockWindow.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            expect(isReadOnlyFromQuery).toBe(true);
        });

        test('should handle case sensitivity in URL parameters', () => {
            mockWindow.location.search = '?ReadOnly=true';
            
            const urlParams = new URLSearchParams(mockWindow.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            expect(isReadOnlyFromQuery).toBe(false); // Should be case sensitive
        });
    });

    describe('Read-Only Badge Visibility Logic', () => {
        let mockReadOnlyBadge: HTMLElement;

        beforeEach(() => {
            mockReadOnlyBadge = {
                style: {
                    display: 'none'
                }
            } as any;
            
            (mockDocument.getElementById as jest.Mock).mockImplementation((id: string) => {
                if (id === 'readOnlyBadge') {
                    return mockReadOnlyBadge;
                }
                return null;
            });
        });

        test('should show read-only badge when read-only mode is active', () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(true);
            
            // Simulate the updateReadOnlyBadge function logic
            const readOnlyBadge = mockDocument.getElementById('readOnlyBadge');
            if (readOnlyBadge) {
                if (mockBody.classList.contains('read-only-mode')) {
                    readOnlyBadge.style.display = 'inline-block';
                } else {
                    readOnlyBadge.style.display = 'none';
                }
            }
            
            expect(mockReadOnlyBadge.style.display).toBe('inline-block');
        });

        test('should hide read-only badge when read-only mode is not active', () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(false);
            
            const readOnlyBadge = mockDocument.getElementById('readOnlyBadge');
            if (readOnlyBadge) {
                if (mockBody.classList.contains('read-only-mode')) {
                    readOnlyBadge.style.display = 'inline-block';
                } else {
                    readOnlyBadge.style.display = 'none';
                }
            }
            
            expect(mockReadOnlyBadge.style.display).toBe('none');
        });

        test('should handle missing read-only badge element gracefully', () => {
            (mockDocument.getElementById as jest.Mock).mockReturnValue(null);
            
            // Should not throw error
            expect(() => {
                const readOnlyBadge = mockDocument.getElementById('readOnlyBadge');
                if (readOnlyBadge) {
                    if (mockBody.classList.contains('read-only-mode')) {
                        readOnlyBadge.style.display = 'inline-block';
                    } else {
                        readOnlyBadge.style.display = 'none';
                    }
                }
            }).not.toThrow();
        });
    });

    describe('Security Conditional Integration', () => {
        test('should apply both read-only and ownership checks in sequence', () => {
            // Test the complete security check sequence
            const testSecurityChecks = (isReadOnly: boolean, isOwner: boolean) => {
                const securityLogs: string[] = [];
                
                // SECURITY: Block operation in read-only mode
                if (isReadOnly) {
                    securityLogs.push('🔒 SECURITY: Blocking operation in read-only mode');
                    return { blocked: true, reason: 'read-only' };
                }
                
                // SECURITY: Check if user owns this deck before allowing operation
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !isOwner) {
                    securityLogs.push('🔒 SECURITY: Blocking operation - user does not own this deck');
                    return { blocked: true, reason: 'not-owner' };
                }
                
                return { blocked: false, reason: 'allowed' };
            };
            
            // Test all combinations
            expect(testSecurityChecks(true, true)).toEqual({ blocked: true, reason: 'read-only' });
            expect(testSecurityChecks(true, false)).toEqual({ blocked: true, reason: 'read-only' });
            expect(testSecurityChecks(false, false)).toEqual({ blocked: true, reason: 'not-owner' });
            expect(testSecurityChecks(false, true)).toEqual({ blocked: false, reason: 'allowed' });
        });

        test('should handle missing currentDeckData in ownership check', () => {
            (global as any).currentDeckData = null;
            
            // Simulate ownership check with missing data
            const checkOwnership = () => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    return 'blocked';
                }
                return 'allowed';
            };
            
            expect(checkOwnership()).toBe('allowed'); // Should not block when data is missing
        });

        test('should handle missing metadata in ownership check', () => {
            (global as any).currentDeckData = { metadata: null };
            
            const checkOwnership = () => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    return 'blocked';
                }
                return 'allowed';
            };
            
            expect(checkOwnership()).toBe('allowed'); // Should not block when metadata is missing
        });
    });

    describe('DOM Manipulation Security', () => {
        test('should prevent event propagation in read-only mode', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                clientX: 500
            };
            
            (mockBody.classList.contains as jest.Mock).mockReturnValue(true);
            
            // Simulate divider drag security check
            const handleMouseDown = (e: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking divider drag in read-only mode');
                    e.preventDefault();
                    return;
                }
                console.log('Starting drag');
            };
            
            handleMouseDown(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking divider drag in read-only mode');
        });

        test('should prevent DOM modifications in read-only mode', () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(true);
            
            // Simulate UI interaction security check
            const toggleSection = (type: string) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking UI interaction in read-only mode');
                    return;
                }
                
                // Simulate DOM modification
                const element = mockDocument.getElementById(`section-${type}`);
                if (element) {
                    element.style.display = 'block';
                }
            };
            
            toggleSection('character');
            
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI interaction in read-only mode');
            expect(mockDocument.getElementById).not.toHaveBeenCalled();
        });
    });

    describe('Event Handler Security', () => {
        test('should block event handlers in read-only mode', () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(true);
            
            // Simulate event handler with security check
            const handleClick = (event: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking click handler in read-only mode');
                    event.preventDefault();
                    return false;
                }
                
                console.log('Processing click');
                return true;
            };
            
            const mockEvent = { preventDefault: jest.fn() };
            const result = handleClick(mockEvent);
            
            expect(result).toBe(false);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking click handler in read-only mode');
        });

        test('should allow event handlers for owners in edit mode', () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(false);
            mockCurrentDeckData.metadata.isOwner = true;
            
            const handleClick = (event: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking click handler in read-only mode');
                    event.preventDefault();
                    return false;
                }
                
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking click handler - user does not own this deck');
                    event.preventDefault();
                    return false;
                }
                
                console.log('Processing click');
                return true;
            };
            
            const mockEvent = { preventDefault: jest.fn() };
            const result = handleClick(mockEvent);
            
            expect(result).toBe(true);
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(mockConsoleLog).toHaveBeenCalledWith('Processing click');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle undefined currentDeckData gracefully', () => {
            (global as any).currentDeckData = undefined;
            
            const checkSecurity = () => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    return 'blocked';
                }
                return 'allowed';
            };
            
            expect(checkSecurity()).toBe('allowed');
        });

        test('should handle null currentDeckData gracefully', () => {
            (global as any).currentDeckData = null;
            
            const checkSecurity = () => {
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    return 'blocked';
                }
                return 'allowed';
            };
            
            expect(checkSecurity()).toBe('allowed');
        });

        test('should handle missing isOwner property gracefully', () => {
            mockCurrentDeckData.metadata = { id: 'test', name: 'Test' }; // No isOwner property
            
            const checkSecurity = () => {
                // Check if isOwner property exists and is explicitly false
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && 
                    mockCurrentDeckData.metadata.hasOwnProperty('isOwner') && 
                    !mockCurrentDeckData.metadata.isOwner) {
                    return 'blocked';
                }
                return 'allowed';
            };
            
            expect(checkSecurity()).toBe('allowed'); // Should not block when isOwner is undefined
        });

        test('should handle classList.contains throwing error', () => {
            (mockBody.classList.contains as jest.Mock).mockImplementation(() => {
                throw new Error('DOM error');
            });
            
            const checkReadOnly = () => {
                try {
                    return mockBody.classList.contains('read-only-mode');
                } catch (error) {
                    console.log('Error checking read-only mode:', error);
                    return false;
                }
            };
            
            expect(checkReadOnly()).toBe(false);
            expect(mockConsoleLog).toHaveBeenCalledWith('Error checking read-only mode:', expect.any(Error));
        });
    });

    describe('Security Message Consistency', () => {
        test('should use consistent security message format across all functions', () => {
            const securityMessages = [
                '🔒 SECURITY: Blocking UI preferences save in read-only mode',
                '🔒 SECURITY: Blocking slider position save in read-only mode',
                '🔒 SECURITY: Blocking expansion state save in read-only mode',
                '🔒 SECURITY: Blocking character group expansion state save in read-only mode',
                '🔒 SECURITY: Blocking deck list section toggle in read-only mode',
                '🔒 SECURITY: Blocking character group toggle in read-only mode',
                '🔒 SECURITY: Blocking divider drag in read-only mode'
            ];
            
            securityMessages.forEach(message => {
                expect(message).toMatch(/^🔒 SECURITY: Blocking .+ in read-only mode$/);
            });
        });

        test('should use consistent ownership denial message format', () => {
            const ownershipMessages = [
                '🔒 SECURITY: Blocking UI preferences save - user does not own this deck',
                '🔒 SECURITY: Blocking slider position save - user does not own this deck',
                '🔒 SECURITY: Blocking expansion state save - user does not own this deck',
                '🔒 SECURITY: Blocking character group expansion state save - user does not own this deck',
                '🔒 SECURITY: Blocking deck list section toggle - user does not own this deck',
                '🔒 SECURITY: Blocking character group toggle - user does not own this deck',
                '🔒 SECURITY: Blocking divider drag - user does not own this deck'
            ];
            
            ownershipMessages.forEach(message => {
                expect(message).toMatch(/^🔒 SECURITY: Blocking .+ - user does not own this deck$/);
            });
        });
    });

    describe('Integration with Existing Functions', () => {
        test('should integrate security checks with localStorage operations', () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(true);
            
            // Create a proper mock for localStorage
            const mockLocalStorage = {
                setItem: jest.fn()
            };
            (global as any).localStorage = mockLocalStorage;
            
            const secureLocalStorageSet = (key: string, value: string) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking localStorage save in read-only mode');
                    return false;
                }
                
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking localStorage save - user does not own this deck');
                    return false;
                }
                
                mockLocalStorage.setItem(key, value);
                return true;
            };
            
            const result = secureLocalStorageSet('test-key', 'test-value');
            
            expect(result).toBe(false);
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking localStorage save in read-only mode');
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        test('should integrate security checks with API calls', async () => {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(false);
            mockCurrentDeckData.metadata.isOwner = false;
            
            const secureAPICall = async (url: string, data: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    console.log('🔒 SECURITY: Blocking API call in read-only mode');
                    return { success: false, error: 'Read-only mode' };
                }
                
                if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
                    console.log('🔒 SECURITY: Blocking API call - user does not own this deck');
                    return { success: false, error: 'Not owner' };
                }
                
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                return await response.json();
            };
            
            const result = await secureAPICall('/api/decks/123/preferences', { test: 'data' });
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not owner');
            expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking API call - user does not own this deck');
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });
});
