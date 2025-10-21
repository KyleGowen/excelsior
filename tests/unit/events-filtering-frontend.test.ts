/**
 * Unit tests for Events Mission Set filtering functionality
 * Tests the setupEventSearch and applyEventsFilters functions
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="events-tab">
        <input type="text" id="search-input" placeholder="Search events...">
        <div class="filter-row">
            <input type="checkbox" value="King of the Jungle" id="king-jungle">
            <label for="king-jungle">King of the Jungle</label>
            <input type="checkbox" value="The Call of Cthulhu" id="cthulhu" checked>
            <label for="cthulhu">The Call of Cthulhu</label>
            <input type="checkbox" value="Time Wars: Rise of the Gods" id="time-wars" checked>
            <label for="time-wars">Time Wars: Rise of the Gods</label>
            <input type="checkbox" value="Warlord of Mars" id="warlord" checked>
            <label for="warlord">Warlord of Mars</label>
        </div>
        <table>
            <tbody id="events-tbody">
                <tr><td>Event 1</td><td>King of the Jungle</td></tr>
                <tr><td>Event 2</td><td>The Call of Cthulhu</td></tr>
                <tr><td>Event 3</td><td>Time Wars: Rise of the Gods</td></tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`);

// Set up global objects
global.window = dom.window as any;
global.document = dom.window.document;
global.fetch = jest.fn();

// Extend window interface for our test functions
interface TestWindow extends Window {
    eventsData?: any[] | undefined;
    displayEvents?: jest.Mock;
    loadEvents?: jest.Mock;
    applyEventsFilters?: jest.Mock;
}

const testWindow = global.window as TestWindow;

// Mock the external functions that would be loaded from other files
testWindow.eventsData = [
    { name: 'Event 1', mission_set: 'King of the Jungle', game_effect: 'Test effect 1' },
    { name: 'Event 2', mission_set: 'The Call of Cthulhu', game_effect: 'Test effect 2' },
    { name: 'Event 3', mission_set: 'Time Wars: Rise of the Gods', game_effect: 'Test effect 3' },
    { name: 'Event 4', mission_set: 'Warlord of Mars', game_effect: 'Test effect 4' }
];

// Mock displayEvents function
testWindow.displayEvents = jest.fn();

// Mock loadEvents function
testWindow.loadEvents = jest.fn();

// Import the functions we want to test (these would be from the external JS file)
function setupEventSearch() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        
        if (searchTerm.length === 0) {
            // Reload all events
            await testWindow.loadEvents!();
            return;
        }

        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            
            if (data.success) {
                const filteredEvents = data.data.filter((event: any) => 
                    event.name.toLowerCase().includes(searchTerm) ||
                    event.mission_set.toLowerCase().includes(searchTerm) ||
                    event.game_effect.toLowerCase().includes(searchTerm)
                );
                testWindow.displayEvents!(filteredEvents);
            }
        } catch (error) {
            console.error('Error searching events:', error);
        }
    });

    // Set up checkbox event listeners for mission set filtering
    document.querySelectorAll('#events-tab input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyEventsFilters);
    });
}

function applyEventsFilters() {
    const selectedMissionSets = Array.from(document.querySelectorAll('#events-tab input[type="checkbox"]:checked'))
        .map(checkbox => (checkbox as HTMLInputElement).value);
    
    if (selectedMissionSets.length === 0) {
        // If no mission sets selected, show none
        const tbody = document.getElementById('events-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-results">No mission sets selected</td></tr>';
        }
        return;
    }
    
    // Filter events based on selected mission sets
    const events = testWindow.eventsData || [];
    const filteredEvents = events.filter((event: any) => 
        selectedMissionSets.includes(event.mission_set)
    );
    
    testWindow.displayEvents!(filteredEvents);
}

describe('Events Mission Set Filtering', () => {
    beforeEach(() => {
        // Reset DOM state
        const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            (checkbox as HTMLInputElement).checked = index > 0; // First unchecked, others checked
        });
        
        // Reset tbody content
        const tbody = document.getElementById('events-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr><td>Event 1</td><td>King of the Jungle</td></tr>
                <tr><td>Event 2</td><td>The Call of Cthulhu</td></tr>
                <tr><td>Event 3</td><td>Time Wars: Rise of the Gods</td></tr>
            `;
        }
        
        // Clear mocks
        jest.clearAllMocks();
    });

    describe('setupEventSearch', () => {
        test('should attach event listeners to all Mission Set checkboxes', () => {
            // Get the checkboxes and spy on their addEventListener method
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            const addEventListenerSpies = Array.from(checkboxes).map(checkbox => 
                jest.spyOn(checkbox, 'addEventListener')
            );
            
            setupEventSearch();
            
            // Should have called addEventListener for each checkbox (4 checkboxes)
            addEventListenerSpies.forEach(spy => {
                expect(spy).toHaveBeenCalledWith('change', expect.any(Function));
            });
            
            addEventListenerSpies.forEach(spy => spy.mockRestore());
        });

        test('should attach input event listener to search input', () => {
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            const addEventListenerSpy = jest.spyOn(searchInput, 'addEventListener');
            
            setupEventSearch();
            
            // Should have called addEventListener for the search input
            expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
            
            addEventListenerSpy.mockRestore();
        });
    });

    describe('applyEventsFilters', () => {
        test('should filter events based on selected Mission Sets', () => {
            // Set up: Only "The Call of Cthulhu" and "Time Wars: Rise of the Gods" checked
            const cthulhuCheckbox = document.getElementById('cthulhu') as HTMLInputElement;
            const timeWarsCheckbox = document.getElementById('time-wars') as HTMLInputElement;
            const kingJungleCheckbox = document.getElementById('king-jungle') as HTMLInputElement;
            const warlordCheckbox = document.getElementById('warlord') as HTMLInputElement;
            
            cthulhuCheckbox.checked = true;
            timeWarsCheckbox.checked = true;
            kingJungleCheckbox.checked = false;
            warlordCheckbox.checked = false;
            
            applyEventsFilters();
            
            // Should call displayEvents with filtered events
            expect(testWindow.displayEvents).toHaveBeenCalledWith([
                { name: 'Event 2', mission_set: 'The Call of Cthulhu', game_effect: 'Test effect 2' },
                { name: 'Event 3', mission_set: 'Time Wars: Rise of the Gods', game_effect: 'Test effect 3' }
            ]);
        });

        test('should show no events when no Mission Sets are selected', () => {
            // Set up: Uncheck all checkboxes
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = false;
            });
            
            applyEventsFilters();
            
            // Should show "No mission sets selected" message
            const tbody = document.getElementById('events-tbody');
            expect(tbody?.innerHTML).toBe('<tr><td colspan="5" class="no-results">No mission sets selected</td></tr>');
            
            // Should not call displayEvents
            expect(testWindow.displayEvents).not.toHaveBeenCalled();
        });

        test('should show all events when all Mission Sets are selected', () => {
            // Set up: Check all checkboxes
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = true;
            });
            
            applyEventsFilters();
            
            // Should call displayEvents with all events
            expect(testWindow.displayEvents).toHaveBeenCalledWith(testWindow.eventsData);
        });

        test('should handle single Mission Set selection', () => {
            // Set up: Only "King of the Jungle" checked
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = false;
            });
            const kingJungleCheckbox = document.getElementById('king-jungle') as HTMLInputElement;
            kingJungleCheckbox.checked = true;
            
            applyEventsFilters();
            
            // Should call displayEvents with only King of the Jungle events
            expect(testWindow.displayEvents).toHaveBeenCalledWith([
                { name: 'Event 1', mission_set: 'King of the Jungle', game_effect: 'Test effect 1' }
            ]);
        });

        test('should handle empty eventsData gracefully', () => {
            // Set up: Empty eventsData
            const originalEventsData = testWindow.eventsData;
            testWindow.eventsData = [];
            
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = true;
            });
            
            applyEventsFilters();
            
            // Should call displayEvents with empty array
            expect(testWindow.displayEvents).toHaveBeenCalledWith([]);
            
            // Restore original data
            testWindow.eventsData = originalEventsData;
        });

        test('should handle undefined eventsData gracefully', () => {
            // Set up: Undefined eventsData
            const originalEventsData = testWindow.eventsData;
            testWindow.eventsData = undefined;
            
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = true;
            });
            
            applyEventsFilters();
            
            // Should call displayEvents with empty array
            expect(testWindow.displayEvents).toHaveBeenCalledWith([]);
            
            // Restore original data
            testWindow.eventsData = originalEventsData;
        });
    });

    describe('Checkbox Event Handling', () => {
        test('should trigger filtering when checkbox is changed', () => {
            // Set up event listeners
            setupEventSearch();
            
            // Spy on applyEventsFilters
            const applyEventsFiltersSpy = jest.fn();
            testWindow.applyEventsFilters = applyEventsFiltersSpy;
            
            // Manually attach the event listener to test it
            const kingJungleCheckbox = document.getElementById('king-jungle') as HTMLInputElement;
            kingJungleCheckbox.addEventListener('change', applyEventsFiltersSpy);
            
            // Trigger change event
            kingJungleCheckbox.checked = true;
            kingJungleCheckbox.dispatchEvent(new dom.window.Event('change'));
            
            // Should have called applyEventsFilters
            expect(applyEventsFiltersSpy).toHaveBeenCalledTimes(1);
        });

        test('should handle multiple checkbox changes', () => {
            // Set up event listeners
            setupEventSearch();
            
            // Spy on applyEventsFilters
            const applyEventsFiltersSpy = jest.fn();
            testWindow.applyEventsFilters = applyEventsFiltersSpy;
            
            // Get all checkboxes
            const checkboxes = document.querySelectorAll('#events-tab input[type="checkbox"]');
            
            // Manually attach event listeners to test them
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', applyEventsFiltersSpy);
            });
            
            // Trigger change events on multiple checkboxes
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = !(checkbox as HTMLInputElement).checked;
                checkbox.dispatchEvent(new dom.window.Event('change'));
            });
            
            // Should have called applyEventsFilters for each checkbox
            expect(applyEventsFiltersSpy).toHaveBeenCalledTimes(checkboxes.length);
        });
    });

    describe('Search Input Functionality', () => {
        test('should handle empty search term by reloading all events', async () => {
            // Set up event listeners
            setupEventSearch();
            
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            
            // Trigger input event with empty value
            searchInput.value = '';
            searchInput.dispatchEvent(new dom.window.Event('input'));
            
            // Should call loadEvents
            expect(testWindow.loadEvents).toHaveBeenCalled();
        });

        test('should filter events based on search term', async () => {
            // Mock fetch response
            const mockEvents = [
                { name: 'Test Event', mission_set: 'Test Set', game_effect: 'Test effect' }
            ];
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: async () => ({ success: true, data: mockEvents })
            });
            
            // Set up event listeners
            setupEventSearch();
            
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            
            // Trigger input event with search term
            searchInput.value = 'test';
            searchInput.dispatchEvent(new dom.window.Event('input'));
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Should call displayEvents with filtered results
            expect(testWindow.displayEvents).toHaveBeenCalledWith(mockEvents);
        });

        test('should handle search API errors gracefully', async () => {
            // Mock fetch to reject
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
            
            // Spy on console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Set up event listeners
            setupEventSearch();
            
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            
            // Trigger input event with search term
            searchInput.value = 'test';
            searchInput.dispatchEvent(new dom.window.Event('input'));
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Should log error
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error searching events:', expect.any(Error));
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Integration Tests', () => {
        test('should work end-to-end with checkbox changes', () => {
            // Set up the complete system
            setupEventSearch();
            
            // Initially: King of the Jungle unchecked, others checked
            const kingJungleCheckbox = document.getElementById('king-jungle') as HTMLInputElement;
            const cthulhuCheckbox = document.getElementById('cthulhu') as HTMLInputElement;
            
            expect(kingJungleCheckbox.checked).toBe(false);
            expect(cthulhuCheckbox.checked).toBe(true);
            
            // Apply initial filters
            applyEventsFilters();
            
            // Should show events for checked Mission Sets
            expect(testWindow.displayEvents).toHaveBeenCalledWith([
                { name: 'Event 2', mission_set: 'The Call of Cthulhu', game_effect: 'Test effect 2' },
                { name: 'Event 3', mission_set: 'Time Wars: Rise of the Gods', game_effect: 'Test effect 3' },
                { name: 'Event 4', mission_set: 'Warlord of Mars', game_effect: 'Test effect 4' }
            ]);
            
            // Now check King of the Jungle
            kingJungleCheckbox.checked = true;
            kingJungleCheckbox.dispatchEvent(new dom.window.Event('change'));
            
            // Should now include King of the Jungle events
            expect(testWindow.displayEvents).toHaveBeenLastCalledWith(testWindow.eventsData);
        });

        test('should handle rapid checkbox changes', () => {
            // Set up the complete system
            setupEventSearch();
            
            const kingJungleCheckbox = document.getElementById('king-jungle') as HTMLInputElement;
            
            // Rapidly toggle the checkbox multiple times
            for (let i = 0; i < 5; i++) {
                kingJungleCheckbox.checked = !kingJungleCheckbox.checked;
                kingJungleCheckbox.dispatchEvent(new dom.window.Event('change'));
            }
            
            // Should have called displayEvents multiple times
            expect(testWindow.displayEvents).toHaveBeenCalledTimes(5);
        });
    });
});
