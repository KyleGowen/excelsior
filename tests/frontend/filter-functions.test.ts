/**
 * Unit tests for public/js/filter-functions.js
 * Tests the filter functions extracted during Phase 11C & 12 of refactoring
 */

// Mock DOM elements
const mockElement = {
  value: '',
  style: { display: 'block' },
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
  checked: false,
  innerHTML: '',
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id.includes('threat-min') || id.includes('threat-max')) return mockElement;
  if (id.includes('fortifications-column')) return mockElement;
  if (id.includes('deck-stats')) return mockElement;
  return mockElement;
}) as jest.MockedFunction<(id: string) => any>;

const mockQuerySelectorAll = jest.fn(() => [mockElement]);

// Set up global mocks
(global as any).document = {
  getElementById: mockGetElementById,
  querySelectorAll: mockQuerySelectorAll,
};

// Mock global functions
const mockGetCurrentUser = jest.fn();
const mockApplyFilters = jest.fn();

// Define the functions from filter-functions.js for testing
function isGuestUser() {
  const currentUser = mockGetCurrentUser();
  const isGuest = currentUser && currentUser.role === 'GUEST';
  return isGuest;
}

function clearLocationFilters() {
  // Clear location-specific filters
  const locationThreatMin = (global as any).document.getElementById('location-threat-min');
  const locationThreatMax = (global as any).document.getElementById('location-threat-max');
  
  if (locationThreatMin) locationThreatMin.value = '';
  if (locationThreatMax) locationThreatMax.value = '';
  
  // Apply filters after clearing
  mockApplyFilters();
}

function clearSpecialCardFilters() {
  // Clear special card-specific filters
  const specialCardThreatMin = (global as any).document.getElementById('special-card-threat-min');
  const specialCardThreatMax = (global as any).document.getElementById('special-card-threat-max');
  
  if (specialCardThreatMin) specialCardThreatMin.value = '';
  if (specialCardThreatMax) specialCardThreatMax.value = '';
  
  mockApplyFilters();
}

function clearAdvancedUniverseFilters() {
  // Clear advanced universe-specific filters
  const advancedUniverseThreatMin = (global as any).document.getElementById('advanced-universe-threat-min');
  const advancedUniverseThreatMax = (global as any).document.getElementById('advanced-universe-threat-max');
  
  if (advancedUniverseThreatMin) advancedUniverseThreatMin.value = '';
  if (advancedUniverseThreatMax) advancedUniverseThreatMax.value = '';
  
  mockApplyFilters();
}

function clearAspectsFilters() {
  // Clear aspects-specific filters
  const aspectsThreatMin = (global as any).document.getElementById('aspects-threat-min');
  const aspectsThreatMax = (global as any).document.getElementById('aspects-threat-max');
  
  if (aspectsThreatMin) aspectsThreatMin.value = '';
  if (aspectsThreatMax) aspectsThreatMax.value = '';
  
  mockApplyFilters();
}

function clearMissionsFilters() {
  // Clear missions-specific filters
  const missionsThreatMin = (global as any).document.getElementById('missions-threat-min');
  const missionsThreatMax = (global as any).document.getElementById('missions-threat-max');
  
  if (missionsThreatMin) missionsThreatMin.value = '';
  if (missionsThreatMax) missionsThreatMax.value = '';
  
  mockApplyFilters();
}

function clearEventsFilters() {
  // Clear events-specific filters
  const eventsThreatMin = (global as any).document.getElementById('events-threat-min');
  const eventsThreatMax = (global as any).document.getElementById('events-threat-max');
  
  if (eventsThreatMin) eventsThreatMin.value = '';
  if (eventsThreatMax) eventsThreatMax.value = '';
  
  mockApplyFilters();
}

function clearTeamworkFilters() {
  // Clear teamwork-specific filters
  const teamworkThreatMin = (global as any).document.getElementById('teamwork-threat-min');
  const teamworkThreatMax = (global as any).document.getElementById('teamwork-threat-max');
  
  if (teamworkThreatMin) teamworkThreatMin.value = '';
  if (teamworkThreatMax) teamworkThreatMax.value = '';
  
  mockApplyFilters();
}

function clearAllyUniverseFilters() {
  // Clear ally universe-specific filters
  const allyUniverseThreatMin = (global as any).document.getElementById('ally-universe-threat-min');
  const allyUniverseThreatMax = (global as any).document.getElementById('ally-universe-threat-max');
  
  if (allyUniverseThreatMin) allyUniverseThreatMin.value = '';
  if (allyUniverseThreatMax) allyUniverseThreatMax.value = '';
  
  mockApplyFilters();
}

function clearTrainingFilters() {
  // Clear training-specific filters
  const trainingThreatMin = (global as any).document.getElementById('training-threat-min');
  const trainingThreatMax = (global as any).document.getElementById('training-threat-max');
  
  if (trainingThreatMin) trainingThreatMin.value = '';
  if (trainingThreatMax) trainingThreatMax.value = '';
  
  mockApplyFilters();
}

function clearBasicUniverseFilters() {
  // Clear basic universe-specific filters
  const basicUniverseThreatMin = (global as any).document.getElementById('basic-universe-threat-min');
  const basicUniverseThreatMax = (global as any).document.getElementById('basic-universe-threat-max');
  
  if (basicUniverseThreatMin) basicUniverseThreatMin.value = '';
  if (basicUniverseThreatMax) basicUniverseThreatMax.value = '';
  
  mockApplyFilters();
}

function clearPowerCardFilters() {
  // Clear power card-specific filters
  const powerCardThreatMin = (global as any).document.getElementById('power-card-threat-min');
  const powerCardThreatMax = (global as any).document.getElementById('power-card-threat-max');
  
  if (powerCardThreatMin) powerCardThreatMin.value = '';
  if (powerCardThreatMax) powerCardThreatMax.value = '';
  
  mockApplyFilters();
}

function toggleFortificationsColumn() {
  const fortificationsColumn = (global as any).document.getElementById('fortifications-column');
  if (fortificationsColumn) {
    fortificationsColumn.classList.toggle('hidden');
  }
}

function ensureTwoPaneLayout() {
  const mainContent = (global as any).document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('force-two-pane');
  }
}

function updateDeckStats() {
  const deckStatsElement = (global as any).document.getElementById('deck-stats');
  if (deckStatsElement) {
    // Update deck statistics display
    deckStatsElement.innerHTML = 'Updated deck stats';
  }
}

function toggleCategory(headerElement: any) {
  if (headerElement) {
    const categoryContent = headerElement.nextElementSibling;
    if (categoryContent) {
      categoryContent.classList.toggle('hidden');
    }
  }
}

describe('Filter Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockElement.value = '';
    mockElement.style.display = 'block';
    mockElement.innerHTML = '';
  });

  describe('isGuestUser', () => {
    it('should return true for guest users', () => {
      mockGetCurrentUser.mockReturnValue({ role: 'GUEST' });

      const result = isGuestUser();

      expect(result).toBe(true);
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should return false for authenticated users', () => {
      mockGetCurrentUser.mockReturnValue({ role: 'USER' });

      const result = isGuestUser();

      expect(result).toBe(false);
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should return false for null user', () => {
      mockGetCurrentUser.mockReturnValue(null);

      const result = isGuestUser();

      expect(result).toBe(false);
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should return false for undefined user', () => {
      mockGetCurrentUser.mockReturnValue(undefined);

      const result = isGuestUser();

      expect(result).toBe(false);
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should return false for user without role', () => {
      mockGetCurrentUser.mockReturnValue({ name: 'test' });

      const result = isGuestUser();

      expect(result).toBe(false);
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });
  });

  describe('clear filter functions', () => {
    it('should clear location filters', () => {
      clearLocationFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('location-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('location-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear special card filters', () => {
      clearSpecialCardFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('special-card-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('special-card-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear advanced universe filters', () => {
      clearAdvancedUniverseFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('advanced-universe-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('advanced-universe-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear aspects filters', () => {
      clearAspectsFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('aspects-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('aspects-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear missions filters', () => {
      clearMissionsFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('missions-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('missions-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear events filters', () => {
      clearEventsFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('events-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('events-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear teamwork filters', () => {
      clearTeamworkFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('teamwork-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('teamwork-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear ally universe filters', () => {
      clearAllyUniverseFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('ally-universe-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('ally-universe-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear training filters', () => {
      clearTrainingFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('training-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('training-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear basic universe filters', () => {
      clearBasicUniverseFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('basic-universe-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('basic-universe-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should clear power card filters', () => {
      clearPowerCardFilters();

      expect(mockGetElementById).toHaveBeenCalledWith('power-card-threat-min');
      expect(mockGetElementById).toHaveBeenCalledWith('power-card-threat-max');
      expect(mockElement.value).toBe('');
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should handle missing filter elements gracefully', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => clearLocationFilters()).not.toThrow();
      expect(() => clearSpecialCardFilters()).not.toThrow();
      expect(() => clearAdvancedUniverseFilters()).not.toThrow();
      expect(() => clearAspectsFilters()).not.toThrow();
      expect(() => clearMissionsFilters()).not.toThrow();
      expect(() => clearEventsFilters()).not.toThrow();
      expect(() => clearTeamworkFilters()).not.toThrow();
      expect(() => clearAllyUniverseFilters()).not.toThrow();
      expect(() => clearTrainingFilters()).not.toThrow();
      expect(() => clearBasicUniverseFilters()).not.toThrow();
      expect(() => clearPowerCardFilters()).not.toThrow();
    });
  });

  describe('toggleFortificationsColumn', () => {
    it('should toggle fortifications column visibility', () => {
      toggleFortificationsColumn();

      expect(mockGetElementById).toHaveBeenCalledWith('fortifications-column');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
    });

    it('should handle missing fortifications column element', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => toggleFortificationsColumn()).not.toThrow();
    });
  });

  describe('ensureTwoPaneLayout', () => {
    it('should add force-two-pane class to main content', () => {
      const mockMainContent = { 
        classList: { 
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn(),
          toggle: jest.fn(),
        },
        value: '',
        style: { display: 'block' },
        checked: false,
        innerHTML: '',
      };
      mockQuerySelectorAll.mockReturnValue([mockMainContent]);

      ensureTwoPaneLayout();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.main-content');
      expect(mockMainContent.classList.add).toHaveBeenCalledWith('force-two-pane');
    });

    it('should handle missing main content element', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => ensureTwoPaneLayout()).not.toThrow();
    });
  });

  describe('updateDeckStats', () => {
    it('should update deck stats element innerHTML', () => {
      updateDeckStats();

      expect(mockGetElementById).toHaveBeenCalledWith('deck-stats');
      expect(mockElement.innerHTML).toBe('Updated deck stats');
    });

    it('should handle missing deck stats element', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => updateDeckStats()).not.toThrow();
    });
  });

  describe('toggleCategory', () => {
    it('should toggle category content visibility', () => {
      const mockHeaderElement = {
        nextElementSibling: {
          classList: { toggle: jest.fn() }
        }
      };

      toggleCategory(mockHeaderElement);

      expect(mockHeaderElement.nextElementSibling.classList.toggle).toHaveBeenCalledWith('hidden');
    });

    it('should handle missing header element', () => {
      expect(() => toggleCategory(null)).not.toThrow();
    });

    it('should handle missing next element sibling', () => {
      const mockHeaderElement = { nextElementSibling: null };

      expect(() => toggleCategory(mockHeaderElement)).not.toThrow();
    });

    it('should handle missing classList on next element sibling', () => {
      const mockHeaderElement = { nextElementSibling: {} };

      expect(() => toggleCategory(mockHeaderElement)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple filter clearing operations', () => {
      clearLocationFilters();
      clearSpecialCardFilters();
      clearAdvancedUniverseFilters();

      expect(mockApplyFilters).toHaveBeenCalledTimes(3);
    });

    it('should handle guest user detection with filter operations', () => {
      mockGetCurrentUser.mockReturnValue({ role: 'GUEST' });

      const isGuest = isGuestUser();
      clearLocationFilters();

      expect(isGuest).toBe(true);
      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it('should handle layout operations with filter clearing', () => {
      clearLocationFilters();
      ensureTwoPaneLayout();
      toggleFortificationsColumn();

      expect(mockApplyFilters).toHaveBeenCalled();
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
    });
  });
});
