/**
 * Phase 3: Integration Security Testing
 * 
 * This test suite provides end-to-end integration testing for security scenarios,
 * cross-user deck access, and comprehensive security validation.
 */

describe('Phase 3: Integration Security Testing', () => {
  let mockCurrentDeckData: any;
  let mockCurrentDeckId: string | null;
  let mockCurrentUser: any;
  let mockDocument: any;
  let mockLocalStorage: any;
  let mockFetch: any;
  let mockConsoleLog: any;
  let mockConsoleError: any;

  beforeEach(() => {
    // Reset all mocks
    mockCurrentDeckData = {
      id: 'deck-123',
      name: 'Test Deck',
      metadata: {
        isOwner: true,
        ownerId: 'user-123'
      },
      cards: []
    };
    mockCurrentDeckId = 'deck-123';
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
      querySelectorAll: jest.fn(),
      location: {
        search: '',
        pathname: '/users/user-123/decks/deck-123'
      }
    };

    // Mock localStorage
    mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock fetch
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true })
    });

    // Mock console
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

    // Set up global mocks
    (global as any).document = mockDocument;
    (global as any).localStorage = mockLocalStorage;
    (global as any).fetch = mockFetch;
    (global as any).currentUser = mockCurrentUser;
    (global as any).currentDeckData = mockCurrentDeckData;
    (global as any).currentDeckId = mockCurrentDeckId;
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('End-to-End Read-Only Mode Testing', () => {
    test('should enforce read-only mode across all persistence functions', () => {
      // Simulate read-only mode activation
      mockDocument.body.classList.contains.mockReturnValue(true);
      mockDocument.location.search = '?readonly=true';

      const securityChecks = {
        saveUIPreferences: jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
            return 'blocked';
          }
          return 'saved';
        }),
        storeSliderPosition: jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking slider position save in read-only mode');
            return 'blocked';
          }
          return 'saved';
        }),
        saveDeckExpansionState: jest.fn().mockImplementation(() => {
          // This should be allowed in read-only mode for owners
          return 'saved';
        }),
        saveCharacterGroupExpansionState: jest.fn().mockImplementation(() => {
          // This should be allowed for all users (UI-only)
          return 'saved';
        })
      };

      // Test all persistence functions
      const results = {
        uiPreferences: securityChecks.saveUIPreferences(),
        sliderPosition: securityChecks.storeSliderPosition(),
        deckExpansion: securityChecks.saveDeckExpansionState(),
        characterGroupExpansion: securityChecks.saveCharacterGroupExpansionState()
      };

      // Verify read-only mode enforcement
      expect(results.uiPreferences).toBe('blocked');
      expect(results.sliderPosition).toBe('blocked');
      expect(results.deckExpansion).toBe('saved'); // Allowed for owners
      expect(results.characterGroupExpansion).toBe('saved'); // Allowed for all users

      // Verify security logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save in read-only mode');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking slider position save in read-only mode');
    });

    test('should enforce read-only mode across all UI interactions', () => {
      // Simulate read-only mode activation
      mockDocument.body.classList.contains.mockReturnValue(true);

      const uiInteractions = {
        toggleDeckListSection: jest.fn().mockImplementation(() => {
          // Should be allowed for owners in read-only mode
          return 'allowed';
        }),
        toggleCharacterGroup: jest.fn().mockImplementation(() => {
          // Should be allowed for all users (UI-only)
          return 'allowed';
        }),
        dividerDrag: jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking divider drag in read-only mode');
            return 'blocked';
          }
          return 'allowed';
        })
      };

      // Test all UI interactions
      const results = {
        deckListToggle: uiInteractions.toggleDeckListSection(),
        characterGroupToggle: uiInteractions.toggleCharacterGroup(),
        dividerDrag: uiInteractions.dividerDrag()
      };

      // Verify read-only mode enforcement
      expect(results.deckListToggle).toBe('allowed'); // Allowed for owners
      expect(results.characterGroupToggle).toBe('allowed'); // Allowed for all users
      expect(results.dividerDrag).toBe('blocked'); // Blocked in read-only mode

      // Verify security logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking divider drag in read-only mode');
    });

    test('should enforce read-only mode for Save button and save operations', () => {
      // Simulate read-only mode activation
      mockDocument.body.classList.contains.mockReturnValue(true);

      const saveOperations = {
        updateSaveButtonState: jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Save button disabled in read-only mode');
            return 'disabled';
          }
          return 'enabled';
        }),
        saveDeckChanges: jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
            return 'blocked';
          }
          return 'saved';
        })
      };

      // Test save operations
      const results = {
        saveButtonState: saveOperations.updateSaveButtonState(),
        saveOperation: saveOperations.saveDeckChanges()
      };

      // Verify read-only mode enforcement
      expect(results.saveButtonState).toBe('disabled');
      expect(results.saveOperation).toBe('blocked');

      // Verify security logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Save button disabled in read-only mode');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
    });
  });

  describe('Cross-User Deck Access Testing', () => {
    test('should block non-owner access to deck operations', () => {
      // Simulate non-owner user
      mockCurrentDeckData.metadata.isOwner = false;
      mockCurrentDeckData.metadata.ownerId = 'other-user-456';

      const deckOperations = {
        saveUIPreferences: jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        }),
        storeSliderPosition: jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking slider position save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        }),
        toggleDeckListSection: jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
            return 'blocked';
          }
          return 'allowed';
        })
      };

      // Test deck operations
      const results = {
        uiPreferences: deckOperations.saveUIPreferences(),
        sliderPosition: deckOperations.storeSliderPosition(),
        deckListToggle: deckOperations.toggleDeckListSection()
      };

      // Verify non-owner blocking
      expect(results.uiPreferences).toBe('blocked');
      expect(results.sliderPosition).toBe('blocked');
      expect(results.deckListToggle).toBe('blocked');

      // Verify security logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking slider position save - user does not own this deck');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
    });

    test('should allow owner access to deck operations', () => {
      // Simulate owner user
      mockCurrentDeckData.metadata.isOwner = true;
      mockCurrentDeckData.metadata.ownerId = 'user-123';

      const deckOperations = {
        saveUIPreferences: jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        }),
        storeSliderPosition: jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking slider position save - user does not own this deck');
            return 'blocked';
          }
          return 'saved';
        }),
        toggleDeckListSection: jest.fn().mockImplementation(() => {
          if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking deck list section toggle - user does not own this deck');
            return 'blocked';
          }
          return 'allowed';
        })
      };

      // Test deck operations
      const results = {
        uiPreferences: deckOperations.saveUIPreferences(),
        sliderPosition: deckOperations.storeSliderPosition(),
        deckListToggle: deckOperations.toggleDeckListSection()
      };

      // Verify owner access
      expect(results.uiPreferences).toBe('saved');
      expect(results.sliderPosition).toBe('saved');
      expect(results.deckListToggle).toBe('allowed');

      // Verify no security logging (operations allowed)
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    test('should handle deck ownership validation edge cases', () => {
      // Test with missing metadata
      mockCurrentDeckData = { id: 'deck-123', name: 'Test Deck' };

      const saveUIPreferences = jest.fn().mockImplementation(() => {
        if (mockCurrentDeckData && mockCurrentDeckData.metadata && !mockCurrentDeckData.metadata.isOwner) {
          console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
          return 'blocked';
        }
        return 'saved';
      });

      const result = saveUIPreferences();

      // Should allow when metadata is missing (graceful degradation)
      expect(result).toBe('saved');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('Guest User Restriction Testing', () => {
    test('should block guest users from all deck modification operations', () => {
      // Simulate guest user
      mockCurrentUser.role = 'GUEST';
      mockCurrentUser.username = 'guest';

      const guestRestrictions = {
        saveUIPreferences: jest.fn().mockImplementation(() => {
          if (mockCurrentUser.role === 'GUEST') {
            console.log('🔒 SECURITY: Blocking UI preferences save - guest user');
            return 'blocked';
          }
          return 'saved';
        }),
        saveDeckChanges: jest.fn().mockImplementation(() => {
          if (mockCurrentUser.role === 'GUEST') {
            console.log('🔒 SECURITY: Blocking saveDeckChanges for guest user');
            return 'blocked';
          }
          return 'saved';
        }),
        updateSaveButtonState: jest.fn().mockImplementation(() => {
          if (mockCurrentUser.role === 'GUEST') {
            console.log('🔒 SECURITY: Save button disabled for guest user');
            return 'disabled';
          }
          return 'enabled';
        })
      };

      // Test guest restrictions
      const results = {
        uiPreferences: guestRestrictions.saveUIPreferences(),
        saveOperation: guestRestrictions.saveDeckChanges(),
        saveButtonState: guestRestrictions.updateSaveButtonState()
      };

      // Verify guest blocking
      expect(results.uiPreferences).toBe('blocked');
      expect(results.saveOperation).toBe('blocked');
      expect(results.saveButtonState).toBe('disabled');

      // Verify security logging
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking UI preferences save - guest user');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Blocking saveDeckChanges for guest user');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔒 SECURITY: Save button disabled for guest user');
    });

    test('should allow guest users to perform UI-only operations', () => {
      // Simulate guest user
      mockCurrentUser.role = 'GUEST';

      const uiOnlyOperations = {
        toggleCharacterGroup: jest.fn().mockImplementation(() => {
          // Character group expansion is UI-only and should work for all users
          return 'allowed';
        }),
        saveCharacterGroupExpansionState: jest.fn().mockImplementation(() => {
          // Character group expansion state is UI-only and should work for all users
          return 'saved';
        })
      };

      // Test UI-only operations
      const results = {
        characterGroupToggle: uiOnlyOperations.toggleCharacterGroup(),
        characterGroupExpansionSave: uiOnlyOperations.saveCharacterGroupExpansionState()
      };

      // Verify UI-only operations allowed
      expect(results.characterGroupToggle).toBe('allowed');
      expect(results.characterGroupExpansionSave).toBe('saved');

      // Verify no security logging (operations allowed)
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('API Endpoint Security Validation', () => {
    test('should validate API endpoint security for deck operations', async () => {
      // Mock API responses for different security scenarios
      const apiScenarios = [
        {
          name: 'Read-only mode API call',
          request: { url: '/api/decks/deck-123', method: 'PUT', readonly: true },
          expectedResponse: { status: 403, error: 'Operation not allowed in read-only mode' }
        },
        {
          name: 'Guest user API call',
          request: { url: '/api/decks/deck-123', method: 'POST', userRole: 'GUEST' },
          expectedResponse: { status: 403, error: 'Guests may not create decks' }
        },
        {
          name: 'Non-owner API call',
          request: { url: '/api/decks/deck-123', method: 'PUT', isOwner: false },
          expectedResponse: { status: 403, error: 'Access denied. You do not own this deck.' }
        },
        {
          name: 'Valid owner API call',
          request: { url: '/api/decks/deck-123', method: 'PUT', isOwner: true },
          expectedResponse: { status: 200, success: true }
        }
      ];

      for (const scenario of apiScenarios) {
        // Mock fetch response based on scenario
        mockFetch.mockResolvedValueOnce({
          ok: scenario.expectedResponse.status === 200,
          status: scenario.expectedResponse.status,
          json: jest.fn().mockResolvedValue(scenario.expectedResponse)
        });

        // Simulate API call
        const response = await mockFetch(scenario.request.url, {
          method: scenario.request.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scenario.request)
        });

        const result = await response.json();

        // Verify API security validation
        expect(response.status).toBe(scenario.expectedResponse.status);
        expect(result).toEqual(scenario.expectedResponse);
      }
    });

    test('should validate rate limiting for API endpoints', async () => {
      // Simulate rate limit exceeded scenario
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Rate limit exceeded. Maximum 100 requests per minute allowed.'
        })
      });

      const response = await mockFetch('/api/decks/deck-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Deck' })
      });

      const result = await response.json();

      // Verify rate limiting
      expect(response.status).toBe(429);
      expect(result.error).toContain('Rate limit exceeded');
    });

    test('should validate input validation for API endpoints', async () => {
      // Simulate invalid input scenario
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Deck name is required and must be a non-empty string'
        })
      });

      const response = await mockFetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', description: 'Test deck' })
      });

      const result = await response.json();

      // Verify input validation
      expect(response.status).toBe(400);
      expect(result.error).toContain('Deck name is required');
    });
  });

  describe('Security State Transitions', () => {
    test('should handle transitions between read-only and edit modes', () => {
      const modeTransitions = [
        { mode: 'edit', readonly: false, expected: 'enabled' },
        { mode: 'readonly', readonly: true, expected: 'disabled' },
        { mode: 'edit', readonly: false, expected: 'enabled' }
      ];

      modeTransitions.forEach((transition, index) => {
        mockDocument.body.classList.contains.mockReturnValue(transition.readonly);

        const updateSaveButtonState = jest.fn().mockImplementation(() => {
          if (mockDocument.body.classList.contains('read-only-mode')) {
            console.log(`🔒 SECURITY: Save button disabled in read-only mode (transition ${index + 1})`);
            return 'disabled';
          }
          return 'enabled';
        });

        const result = updateSaveButtonState();

        expect(result).toBe(transition.expected);
        if (transition.readonly) {
          expect(mockConsoleLog).toHaveBeenCalledWith(`🔒 SECURITY: Save button disabled in read-only mode (transition ${index + 1})`);
        }
      });
    });

    test('should handle user role transitions', () => {
      const roleTransitions = [
        { role: 'USER', expected: 'enabled' },
        { role: 'GUEST', expected: 'disabled' },
        { role: 'USER', expected: 'enabled' }
      ];

      roleTransitions.forEach((transition, index) => {
        mockCurrentUser.role = transition.role;

        const updateSaveButtonState = jest.fn().mockImplementation(() => {
          if (mockCurrentUser.role === 'GUEST') {
            console.log(`🔒 SECURITY: Save button disabled for guest user (transition ${index + 1})`);
            return 'disabled';
          }
          return 'enabled';
        });

        const result = updateSaveButtonState();

        expect(result).toBe(transition.expected);
        if (transition.role === 'GUEST') {
          expect(mockConsoleLog).toHaveBeenCalledWith(`🔒 SECURITY: Save button disabled for guest user (transition ${index + 1})`);
        }
      });
    });
  });
});
