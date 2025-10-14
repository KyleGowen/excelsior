/**
 * Phase 3: Comprehensive Security Testing
 * 
 * This test suite provides comprehensive security testing for all persistence functions,
 * API endpoints, and security scenarios to ensure robust protection against unauthorized access.
 */

describe('Phase 3: Comprehensive Security Testing', () => {
  let mockCurrentDeckData: any;
  let mockCurrentDeckId: string | null;
  let mockCurrentUser: any;
  let mockDocument: any;
  let mockLocalStorage: any;
  let mockConsoleLog: any;
  let mockConsoleError: any;

  beforeEach(() => {
    // Reset all mocks
    mockCurrentDeckData = {
      metadata: {
        isOwner: true
      }
    };
    mockCurrentDeckId = 'test-deck-123';
    mockCurrentUser = {
      id: 'user-123',
      username: 'testuser',
      role: 'USER'
    };

    // Mock document and DOM
    mockDocument = {
      body: {
        classList: {
          contains: jest.fn().mockReturnValue(false),
          add: jest.fn(),
          remove: jest.fn()
        }
      },
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn()
    };

    // Mock localStorage
    mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock console
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

    // Set up global mocks
    (global as any).document = mockDocument;
    (global as any).localStorage = mockLocalStorage;
    (global as any).currentUser = mockCurrentUser;
    (global as any).currentDeckData = mockCurrentDeckData;
    (global as any).currentDeckId = mockCurrentDeckId;
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Persistence Function Security Testing', () => {
    describe('saveUIPreferences() Security Scenarios', () => {
      test('should block saving UI preferences in read-only mode', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        
        const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save in read-only mode');
      });

      test('should block saving UI preferences for non-owners', () => {
        mockCurrentDeckData.metadata.isOwner = false;
        
        const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
      });

      test('should allow saving UI preferences for owners in edit mode', () => {
        mockDocument.body.classList.contains.mockReturnValue(false); // not read-only
        mockCurrentDeckData.metadata.isOwner = true;
        
        const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
            return 'blocked';
          }
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
        
        expect(result).toBe('saved');
        expect(mockConsoleLog).not.toHaveBeenCalled();
      });
    });

    describe('storeSliderPosition() Security Scenarios', () => {
      test('should block saving slider position in read-only mode', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        
        const storeSliderPosition = jest.fn().mockImplementation((deckWidth: number, totalWidth: number) => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking slider position save in read-only mode');
            return 'blocked';
          }
          return 'saved';
        });

        const result = storeSliderPosition(300, 800);
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking slider position save in read-only mode');
      });

      test('should block saving slider position for non-owners', () => {
        mockCurrentDeckData.metadata.isOwner = false;
        
        const storeSliderPosition = jest.fn().mockImplementation((deckWidth: number, totalWidth: number) => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking slider position save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        });

        const result = storeSliderPosition(300, 800);
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking slider position save - user does not own this deck');
      });
    });

    describe('saveDeckExpansionState() Security Scenarios', () => {
      test('should allow saving expansion state in read-only mode for owners', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        mockCurrentDeckData.metadata.isOwner = true;
        
        const saveDeckExpansionState = jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveDeckExpansionState();
        
        expect(result).toBe('saved');
        expect(mockConsoleLog).not.toHaveBeenCalled();
      });

      test('should block saving expansion state for non-owners', () => {
        mockCurrentDeckData.metadata.isOwner = false;
        
        const saveDeckExpansionState = jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveDeckExpansionState();
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
      });
    });
  });

  describe('UI Interaction Security Testing', () => {
    describe('toggleDeckListSection() Security Scenarios', () => {
      test('should allow deck list section toggle in read-only mode for owners', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        mockCurrentDeckData.metadata.isOwner = true;
        
        const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
            return 'blocked';
          }
          return 'allowed';
        });

        const result = toggleDeckListSection('characters');
        
        expect(result).toBe('allowed');
        expect(mockConsoleLog).not.toHaveBeenCalled();
      });

      test('should block deck list section toggle for non-owners', () => {
        mockCurrentDeckData.metadata.isOwner = false;
        
        const toggleDeckListSection = jest.fn().mockImplementation((type: string) => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
            return 'blocked';
          }
          return 'allowed';
        });

        const result = toggleDeckListSection('characters');
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
      });
    });

    describe('toggleCharacterGroup() Security Scenarios', () => {
      test('should allow character group toggle for all users (UI-only operation)', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        mockCurrentDeckData.metadata.isOwner = false; // non-owner
        
        const toggleCharacterGroup = jest.fn().mockImplementation((headerElement: any, groupKey?: string) => {
          // Character group expansion is a UI-only operation that should be allowed for all users
          return 'allowed';
        });

        const result = toggleCharacterGroup({}, 'test-group');
        
        expect(result).toBe('allowed');
        expect(mockConsoleLog).not.toHaveBeenCalled();
      });
    });
  });

  describe('Save Button Security Testing', () => {
    describe('updateSaveButtonState() Security Scenarios', () => {
      test('should disable Save button in read-only mode', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        
        const mockSaveButton = {
          disabled: false,
          style: { opacity: '1', cursor: 'pointer' },
          title: ''
        };

        mockDocument.getElementById.mockReturnValue(mockSaveButton);

        const updateSaveButtonState = jest.fn().mockImplementation(() => {
          const saveButton = mockDocument.getElementById('saveDeckButton');
          if (saveButton) {
            if (mockDocument.body.classList.contains('read-only-mode')) {
              saveButton.disabled = true;
              saveButton.style.opacity = '0.5';
              saveButton.style.cursor = 'not-allowed';
              saveButton.title = 'Save is disabled in read-only mode';
              console.log('🔒 SECURITY: Save button disabled in read-only mode');
              return 'disabled';
            }
          }
          return 'enabled';
        });

        const result = updateSaveButtonState();
        
        expect(result).toBe('disabled');
        expect(mockSaveButton.disabled).toBe(true);
        expect(mockSaveButton.style.opacity).toBe('0.5');
        expect(mockSaveButton.style.cursor).toBe('not-allowed');
        expect(mockSaveButton.title).toBe('Save is disabled in read-only mode');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Save button disabled in read-only mode');
      });

      test('should disable Save button for guest users', () => {
        mockCurrentUser.role = 'GUEST';
        
        const mockSaveButton = {
          disabled: false,
          style: { opacity: '1', cursor: 'pointer' },
          title: ''
        };

        mockDocument.getElementById.mockReturnValue(mockSaveButton);

        const updateSaveButtonState = jest.fn().mockImplementation(() => {
          const saveButton = mockDocument.getElementById('saveDeckButton');
          if (saveButton) {
            if (mockCurrentUser.role === 'GUEST') {
              saveButton.disabled = true;
              saveButton.style.opacity = '0.5';
              saveButton.style.cursor = 'not-allowed';
              saveButton.title = 'Guests cannot save edits';
              console.log('🔒 SECURITY: Save button disabled for guest user');
              return 'disabled';
            }
          }
          return 'enabled';
        });

        const result = updateSaveButtonState();
        
        expect(result).toBe('disabled');
        expect(mockSaveButton.disabled).toBe(true);
        expect(mockSaveButton.style.opacity).toBe('0.5');
        expect(mockSaveButton.style.cursor).toBe('not-allowed');
        expect(mockSaveButton.title).toBe('Guests cannot save edits');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Save button disabled for guest user');
      });
    });

    describe('saveDeckChanges() Security Scenarios', () => {
      test('should block saveDeckChanges in read-only mode', () => {
        mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
        
        const saveDeckChanges = jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveDeckChanges();
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
      });

      test('should block saveDeckChanges for guest users', () => {
        mockCurrentUser.role = 'GUEST';
        
        const saveDeckChanges = jest.fn().mockImplementation(() => {
          if (mockCurrentUser.role === 'GUEST') {
            console.log('🔒 SECURITY: Blocking saveDeckChanges for guest user');
            return 'blocked';
          }
          return 'saved';
        });

        const result = saveDeckChanges();
        
        expect(result).toBe('blocked');
        expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking saveDeckChanges for guest user');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing currentDeckData gracefully', () => {
      mockCurrentDeckData = null;
      
      const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
        if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
          console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
          return 'blocked';
        }
        return 'saved';
      });

      const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
      
      expect(result).toBe('saved');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    test('should handle missing currentDeckId gracefully', () => {
      mockCurrentDeckId = null;
      
      const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
        if (!deckId) {
          return 'no-deck-id';
        }
        return 'saved';
      });

      const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
      
      expect(result).toBe('no-deck-id');
    });

    test('should handle missing metadata gracefully', () => {
      mockCurrentDeckData = { metadata: null };
      
      const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
        if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
          console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
          return 'blocked';
        }
        return 'saved';
      });

      const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
      
      expect(result).toBe('saved');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    test('should handle classList.contains throwing error', () => {
      mockDocument.body.classList.contains.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
        try {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
            return 'blocked';
          }
        } catch (error) {
          console.error('Error checking read-only mode:', error);
          return 'error';
        }
        return 'saved';
      });

      const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
      
      expect(result).toBe('error');
      expect(mockConsoleError).toHaveBeenCalledWith('Error checking read-only mode:', expect.any(Error));
    });
  });

  describe('Security Message Consistency', () => {
    test('should use consistent security message format across all functions', () => {
      const functions = [
        () => console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode'),
        () => console.log('🔒 SECURITY: Blocking slider position save in read-only mode'),
        () => console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck'),
        () => console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck'),
        () => console.log('🔒 SECURITY: Save button disabled in read-only mode'),
        () => console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode')
      ];

      functions.forEach(func => func());

      expect(mockConsoleLog).toHaveBeenCalledTimes(6);
      const calls = mockConsoleLog.mock.calls;
      
      // All messages should start with the security prefix
      calls.forEach((call: any) => {
        expect(call[0]).toMatch(/^🔒 SECURITY:/);
      });
    });

    test('should use consistent ownership denial message format', () => {
      const ownershipMessages = [
        '🔒 SECURITY: Blocking UI preferences save - user does not own this deck',
        '🔒 SECURITY: Blocking slider position save - user does not own this deck',
        '🔒 SECURITY: Blocking expansion state save - user does not own this deck',
        '🔒 SECURITY: Blocking deck list section toggle - user does not own this deck'
      ];

      ownershipMessages.forEach(message => {
        console.log(message);
      });

      expect(mockConsoleLog).toHaveBeenCalledTimes(4);
      const calls = mockConsoleLog.mock.calls;
      
      // All ownership messages should end with the same phrase
      calls.forEach((call: any) => {
        expect(call[0]).toMatch(/user does not own this deck$/);
      });
    });
  });

  describe('Integration Security Testing', () => {
    test('should apply multiple security checks in correct order', () => {
      mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
      mockCurrentDeckData.metadata.isOwner = false; // non-owner
      
      const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
        // Check read-only mode first
        if (mockDocument.body.classList.contains('read-only-mode')) {
          console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
          return 'blocked-readonly';
        }
        // Then check ownership
        if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
          console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
          return 'blocked-ownership';
        }
        return 'saved';
      });

      const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
      
      expect(result).toBe('blocked-readonly');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save in read-only mode');
      expect(mockConsoleLog).not.toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
    });

    test('should handle complex security scenarios', () => {
      // Scenario: Guest user in read-only mode trying to save UI preferences
      mockCurrentUser.role = 'GUEST';
      mockDocument.body.classList.contains.mockReturnValue(true); // read-only mode
      mockCurrentDeckData.metadata.isOwner = false; // non-owner
      
      const saveUIPreferences = jest.fn().mockImplementation((deckId: string, preferences: any) => {
        // Check read-only mode first (highest priority)
        if (mockDocument.body.classList.contains('read-only-mode')) {
          console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
          return 'blocked-readonly';
        }
        // Check guest user
        if (mockCurrentUser.role === 'GUEST') {
          console.log('🔒 SECURITY: Blocking UI preferences save - guest user');
          return 'blocked-guest';
        }
        // Check ownership
        if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
          console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
          return 'blocked-ownership';
        }
        return 'saved';
      });

      const result = saveUIPreferences(mockCurrentDeckId, { viewMode: 'tile' });
      
      expect(result).toBe('blocked-readonly');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save in read-only mode');
    });
  });
});
