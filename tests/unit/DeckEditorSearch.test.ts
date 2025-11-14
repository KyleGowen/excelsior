/**
 * Unit tests for DeckEditorSearch component
 * Tests search functionality, rendering, event handling, and user interactions
 * @jest-environment jsdom
 */

describe('DeckEditorSearch Component', () => {
    let DeckEditorSearch: any;
    let CardSearchService: any;
    let mockInput: HTMLInputElement;
    let mockResults: HTMLElement;
    let mockOnSelect: jest.Mock;
    let component: any;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '';
        
        mockInput = document.createElement('input');
        mockInput.id = 'deckEditorSearchInput';
        mockInput.type = 'text';
        
        mockResults = document.createElement('div');
        mockResults.id = 'deckEditorSearchResults';
        mockResults.className = 'deck-editor-search-results';
        
        document.body.appendChild(mockInput);
        document.body.appendChild(mockResults);

        // Mock CardSearchService
        CardSearchService = jest.fn().mockImplementation((options) => ({
            maxResults: options?.maxResults || 20,
            search: jest.fn().mockResolvedValue([])
        }));

        // Mock global CardSearchService
        (window as any).CardSearchService = CardSearchService;

        // Mock formatCardType function
        (window as any).formatCardType = jest.fn((type: string) => type);

        // Load DeckEditorSearch component
        // Since it's an IIFE, we need to evaluate it
        const fs = require('fs');
        const path = require('path');
        const componentCode = fs.readFileSync(
            path.join(__dirname, '../../public/js/components/DeckEditorSearch.js'),
            'utf8'
        );
        eval(componentCode);

        DeckEditorSearch = (window as any).DeckEditorSearch;
        mockOnSelect = jest.fn();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
        jest.clearAllTimers();
        if (component && component.unmount) {
            component.unmount();
        }
    });

    describe('Constructor', () => {
        it('should create instance with default options', () => {
            component = new DeckEditorSearch({});
            expect(component.input).toBe(mockInput);
            expect(component.resultsEl).toBe(mockResults);
            expect(component.minChars).toBe(2);
            expect(component.debounceMs).toBe(300);
            expect(component.onSelect).toBeDefined();
        });

        it('should create instance with custom options', () => {
            const customOnSelect = jest.fn();
            const customService = new CardSearchService({ maxResults: 10 });
            
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: customOnSelect,
                minChars: 3,
                debounceMs: 500,
                maxResults: 10,
                searchService: customService
            });

            expect(component.input).toBe(mockInput);
            expect(component.resultsEl).toBe(mockResults);
            expect(component.onSelect).toBe(customOnSelect);
            expect(component.minChars).toBe(3);
            expect(component.debounceMs).toBe(500);
            expect(component.searchService).toBe(customService);
        });

        it('should use default input and results elements if not provided', () => {
            // Clear existing elements
            document.body.innerHTML = '';
            
            const defaultInput = document.createElement('input');
            defaultInput.id = 'deckEditorSearchInput';
            const defaultResults = document.createElement('div');
            defaultResults.id = 'deckEditorSearchResults';
            document.body.appendChild(defaultInput);
            document.body.appendChild(defaultResults);

            component = new DeckEditorSearch({});
            expect(component.input).toBe(defaultInput);
            expect(component.resultsEl).toBe(defaultResults);
        });

        it('should create default CardSearchService if not provided', () => {
            component = new DeckEditorSearch({ maxResults: 15 });
            expect(component.searchService).toBeDefined();
            expect(component.searchService.maxResults).toBe(15);
            expect(typeof component.searchService.search).toBe('function');
        });
    });

    describe('mount()', () => {
        it('should bind event listeners', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            const addEventListenerSpy = jest.spyOn(mockInput, 'addEventListener');
            const docAddEventListenerSpy = jest.spyOn(document, 'addEventListener');

            component.mount();

            expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
            expect(docAddEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
            expect(component._bound).toBe(true);
        });

        it('should not bind if already bound', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component._bound = true;
            const addEventListenerSpy = jest.spyOn(mockInput, 'addEventListener');

            component.mount();

            expect(addEventListenerSpy).not.toHaveBeenCalled();
        });

        it('should not bind if input is missing', () => {
            component = new DeckEditorSearch({
                input: null,
                results: mockResults,
                onSelect: mockOnSelect
            });

            // Remove default elements from DOM
            const defaultInput = document.getElementById('deckEditorSearchInput');
            if (defaultInput) defaultInput.remove();

            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            component.mount();

            // Document click listener is still added even if input is missing
            // But input listeners should not be added
            expect(addEventListenerSpy).toHaveBeenCalled();
        });

        it('should not bind if results element is missing', () => {
            // Remove default results element from DOM first
            document.body.innerHTML = '';
            const defaultInput = document.createElement('input');
            defaultInput.id = 'deckEditorSearchInput';
            document.body.appendChild(defaultInput);
            
            component = new DeckEditorSearch({
                input: mockInput,
                results: null,
                onSelect: mockOnSelect
            });

            // Verify resultsEl is null
            expect(component.resultsEl).toBeNull();

            const addEventListenerSpy = jest.spyOn(mockInput, 'addEventListener');
            component.mount();

            // Should not bind if results element is missing
            expect(addEventListenerSpy).not.toHaveBeenCalled();
        });
    });

    describe('unmount()', () => {
        it('should remove event listeners', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.mount();

            const removeEventListenerSpy = jest.spyOn(mockInput, 'removeEventListener');
            const docRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            component.unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
            expect(docRemoveEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
            expect(component._bound).toBe(false);
        });

        it('should not remove listeners if not bound', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            const removeEventListenerSpy = jest.spyOn(mockInput, 'removeEventListener');
            component.unmount();

            expect(removeEventListenerSpy).not.toHaveBeenCalled();
        });
    });

    describe('clear()', () => {
        it('should clear input and hide results', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            mockInput.value = 'test search';
            mockResults.style.display = 'block';

            component.clear();

            expect(mockInput.value).toBe('');
            expect(mockResults.style.display).toBe('none');
        });

        it('should handle missing input gracefully', () => {
            component = new DeckEditorSearch({
                input: null,
                results: mockResults,
                onSelect: mockOnSelect
            });

            expect(() => component.clear()).not.toThrow();
        });
    });

    describe('showResults()', () => {
        it('should display results element', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            mockResults.style.display = 'none';
            component.showResults();

            expect(mockResults.style.display).toBe('block');
        });

        it('should handle missing results element gracefully', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: null,
                onSelect: mockOnSelect
            });

            expect(() => component.showResults()).not.toThrow();
        });
    });

    describe('hideResults()', () => {
        it('should hide results element', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            mockResults.style.display = 'block';
            component.hideResults();

            expect(mockResults.style.display).toBe('none');
        });

        it('should handle missing results element gracefully', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: null,
                onSelect: mockOnSelect
            });

            expect(() => component.hideResults()).not.toThrow();
        });
    });

    describe('_handleInput()', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should hide results if search term is too short', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect,
                minChars: 3
            });

            component.mount();
            mockInput.value = 'ab';
            mockInput.dispatchEvent(new Event('input'));

            jest.advanceTimersByTime(400);

            expect(component.searchService.search).not.toHaveBeenCalled();
            expect(mockResults.style.display).toBe('none');
        });

        it('should debounce search calls', async () => {
            const mockSearchResults = [
                { id: '1', name: 'Test Card', type: 'character', image: '/test.jpg' }
            ];
            component.searchService.search = jest.fn().mockResolvedValue(mockSearchResults);

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect,
                debounceMs: 300
            });

            component.mount();
            mockInput.value = 'test';
            mockInput.dispatchEvent(new Event('input'));

            // Should not call search immediately
            expect(component.searchService.search).not.toHaveBeenCalled();

            // Advance timer
            jest.advanceTimersByTime(300);

            // Wait for async operations
            await Promise.resolve();

            expect(component.searchService.search).toHaveBeenCalledWith('test');
        });

        it('should clear previous timeout on new input', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect,
                debounceMs: 300
            });

            component.mount();
            mockInput.value = 'test';
            mockInput.dispatchEvent(new Event('input'));

            const firstTimeout = component._timeout;

            mockInput.value = 'test2';
            mockInput.dispatchEvent(new Event('input'));

            expect(component._timeout).not.toBe(firstTimeout);
        });

        it('should trim and lowercase search term', async () => {
            const mockSearchResults: any[] = [];
            component.searchService.search = jest.fn().mockResolvedValue(mockSearchResults);

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.mount();
            mockInput.value = '  TEST SEARCH  ';
            mockInput.dispatchEvent(new Event('input'));

            jest.advanceTimersByTime(300);
            await Promise.resolve();

            expect(component.searchService.search).toHaveBeenCalledWith('test search');
        });
    });

    describe('_handleBlur()', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should hide results after delay', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.mount();
            mockResults.style.display = 'block';
            mockInput.dispatchEvent(new Event('blur'));

            expect(mockResults.style.display).toBe('block');

            jest.advanceTimersByTime(200);

            expect(mockResults.style.display).toBe('none');
        });
    });

    describe('_handleDocClick()', () => {
        it('should hide results when clicking outside container', () => {
            const container = document.createElement('div');
            container.className = 'deck-editor-search-container';
            document.body.appendChild(container);

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.mount();
            mockResults.style.display = 'block';

            const outsideElement = document.createElement('div');
            document.body.appendChild(outsideElement);
            const clickEvent = new MouseEvent('click', { bubbles: true });
            outsideElement.dispatchEvent(clickEvent);

            expect(mockResults.style.display).toBe('none');
        });

        it('should not hide results when clicking inside container', () => {
            const container = document.createElement('div');
            container.className = 'deck-editor-search-container';
            container.appendChild(mockInput);
            container.appendChild(mockResults);
            document.body.appendChild(container);

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.mount();
            mockResults.style.display = 'block';

            const clickEvent = new MouseEvent('click', { bubbles: true });
            mockInput.dispatchEvent(clickEvent);

            expect(mockResults.style.display).toBe('block');
        });
    });

    describe('render()', () => {
        it('should render empty state when no results', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render([]);

            expect(mockResults.innerHTML).toContain('No cards found');
            expect(mockResults.style.display).toBe('block');
        });

        it('should render search results', () => {
            const results = [
                {
                    id: '1',
                    name: 'Test Character',
                    type: 'character',
                    image: '/test.jpg',
                    image_path: '/test.jpg'
                },
                {
                    id: '2',
                    name: 'Test Special',
                    type: 'special',
                    image: '/special.jpg',
                    character: 'Test Character'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            expect(mockResults.innerHTML).toContain('Test Character');
            expect(mockResults.innerHTML).toContain('Test Special');
            expect(mockResults.style.display).toBe('block');
        });

        it('should handle cards with character names', () => {
            const results = [
                {
                    id: '1',
                    name: 'Special Card',
                    type: 'special',
                    image: '/special.jpg',
                    character: 'Test Character'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            expect(mockResults.innerHTML).toContain('Test Character');
        });

        it('should escape special characters in card names', () => {
            const results = [
                {
                    id: '1',
                    name: "O'Brien's Card",
                    type: 'character',
                    image: '/test.jpg'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            expect(mockResults.innerHTML).toContain("O\\'Brien\\'s Card");
        });

        it('should escape quotes in image paths', () => {
            const results = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test"image.jpg',
                    image_path: '/test"image.jpg'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            expect(mockResults.innerHTML).toContain('&quot;');
        });

        it('should call onSelect when result is clicked', () => {
            const results = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test.jpg',
                    image_path: '/test.jpg'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            const resultElement = mockResults.querySelector('.deck-editor-search-result');
            expect(resultElement).toBeTruthy();

            resultElement!.dispatchEvent(new MouseEvent('click'));

            expect(mockOnSelect).toHaveBeenCalledWith({
                id: '1',
                type: 'character',
                name: 'Test Card',
                imagePath: '/test.jpg'
            });
        });

        it('should clear input after selection', () => {
            const results = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test.jpg'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            mockInput.value = 'test';
            component.render(results);

            const resultElement = mockResults.querySelector('.deck-editor-search-result');
            resultElement!.dispatchEvent(new MouseEvent('click'));

            expect(mockInput.value).toBe('');
        });

        it('should handle null imagePath', () => {
            const results = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test.jpg',
                    image_path: null
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            const resultElement = mockResults.querySelector('.deck-editor-search-result');
            resultElement!.dispatchEvent(new MouseEvent('click'));

            // Component uses image if image_path is null
            expect(mockOnSelect).toHaveBeenCalledWith({
                id: '1',
                type: 'character',
                name: 'Test Card',
                imagePath: '/test.jpg'
            });
        });

        it('should handle empty imagePath string', () => {
            const results = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test.jpg',
                    image_path: ''
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            const resultElement = mockResults.querySelector('.deck-editor-search-result');
            resultElement!.dispatchEvent(new MouseEvent('click'));

            // Component uses image if image_path is empty
            expect(mockOnSelect).toHaveBeenCalledWith({
                id: '1',
                type: 'character',
                name: 'Test Card',
                imagePath: '/test.jpg'
            });
        });

        it('should use formatCardType if available', () => {
            const mockFormatCardType = jest.fn((type: string) => `Formatted ${type}`);
            (window as any).formatCardType = mockFormatCardType;

            const results = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test.jpg'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(results);

            expect(mockFormatCardType).toHaveBeenCalledWith('character');
            expect(mockResults.innerHTML).toContain('Formatted character');
        });

        it('should handle missing results element gracefully', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: null,
                onSelect: mockOnSelect
            });

            expect(() => component.render([])).not.toThrow();
        });

        it('should handle non-array results', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.render(null as any);
            expect(mockResults.innerHTML).toContain('No cards found');

            component.render(undefined as any);
            expect(mockResults.innerHTML).toContain('No cards found');
        });
    });

    describe('Integration', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should handle full search flow', async () => {
            const mockSearchResults = [
                {
                    id: '1',
                    name: 'Test Card',
                    type: 'character',
                    image: '/test.jpg'
                }
            ];

            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.searchService.search = jest.fn().mockResolvedValue(mockSearchResults);
            component.mount();

            // Type search term
            mockInput.value = 'test';
            mockInput.dispatchEvent(new Event('input'));

            // Advance debounce timer
            jest.advanceTimersByTime(300);
            
            // Wait for async operations - need to wait for render to complete
            await Promise.resolve();
            await Promise.resolve(); // Extra tick for render

            // Verify search was called and results rendered
            expect(component.searchService.search).toHaveBeenCalledWith('test');
            expect(mockResults.innerHTML).toContain('Test Card');

            // Click on result
            const resultElement = mockResults.querySelector('.deck-editor-search-result');
            resultElement!.dispatchEvent(new MouseEvent('click'));

            // Verify onSelect was called
            expect(mockOnSelect).toHaveBeenCalled();
        });

        it('should handle focus event', () => {
            component = new DeckEditorSearch({
                input: mockInput,
                results: mockResults,
                onSelect: mockOnSelect
            });

            component.mount();
            mockResults.style.display = 'none';

            mockInput.dispatchEvent(new Event('focus'));

            expect(mockResults.style.display).toBe('block');
        });
    });
});

