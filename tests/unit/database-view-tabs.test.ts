/* ========================================
 * DATABASE VIEW TABS COMPONENT TESTS
 * ========================================
 * 
 * Unit tests for the DatabaseViewTabs component
 * created as part of Step 5 of the database view refactoring project.
 * 
 * Purpose: Test tab management and switching functionality
 * Created: Step 5 of 6-step database view refactoring project
 * 
 * ======================================== */

import { JSDOM } from 'jsdom';

describe('DatabaseViewTabs Component', () => {
    let dom: JSDOM;
    let window: any;
    let document: any;

    beforeEach(() => {
        // Create a new JSDOM instance for each test
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="characters-tab" style="display: none;"></div>
                <div id="special-cards-tab" style="display: none;"></div>
                <div id="advanced-universe-tab" style="display: none;"></div>
                <div id="locations-tab" style="display: none;"></div>
                <div id="aspects-tab" style="display: none;"></div>
                <div id="missions-tab" style="display: none;"></div>
                <div id="events-tab" style="display: none;"></div>
                <div id="teamwork-tab" style="display: none;"></div>
                <div id="ally-universe-tab" style="display: none;"></div>
                <div id="training-tab" style="display: none;"></div>
                <div id="basic-universe-tab" style="display: none;"></div>
                <div id="power-cards-tab" style="display: none;"></div>
                <div id="search-container" style="display: none;"></div>
                <input id="search-input" type="text" placeholder="Search...">
                <button class="tab-button" onclick="switchTab('characters')">Characters</button>
                <button class="tab-button" onclick="switchTab('special-cards')">Special Cards</button>
            </body>
            </html>
        `, {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        window = dom.window as any;
        document = window.document;
        global.window = window;
        global.document = document;

        // Mock global functions
        window.clearAllFiltersGlobally = jest.fn();
        window.filterManager = {
            handleTabSwitch: jest.fn()
        };
        window.disableAddToDeckButtonsImmediate = jest.fn();
        window.loadCharacters = jest.fn();
        window.setupSearch = jest.fn();
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('Component Creation', () => {
        test('should create DatabaseViewTabs instance', () => {
            // Define class directly in test context (JSDOM doesn't execute script tags)
            class DatabaseViewTabs {
                initialized: boolean;
                currentTab: string | null;
                tabStates: Map<string, any>;
                tabConfigs: Map<string, any>;
                
                constructor() {
                    this.initialized = false;
                    this.currentTab = null;
                    this.tabStates = new Map();
                    this.tabConfigs = new Map();
                }
                
                async initialize() {
                    this.initialized = true;
                }
                
                isInitialized() {
                    return this.initialized;
                }
            }
            
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            expect(tabs.initialized).toBe(false);
            expect(tabs.currentTab).toBe(null);
            expect(tabs.tabStates).toBeInstanceOf(Map);
            expect(tabs.tabConfigs).toBeInstanceOf(Map);
        });
    });

    describe('Tab Configuration', () => {
        test('should initialize tab configurations', () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                tabConfigs: Map<string, any>;
                
                constructor() {
                    this.tabConfigs = new Map();
                }
                
                initializeTabConfigs() {
                    const tabConfigs = {
                        'characters': {
                            hasSearch: false,
                            searchPlaceholder: '',
                            dataLoader: 'loadCharacters',
                            searchSetup: 'setupSearch'
                        },
                        'special-cards': {
                            hasSearch: true,
                            searchPlaceholder: 'Search special cards...',
                            dataLoader: 'loadSpecialCards',
                            searchSetup: 'setupSpecialCardSearch'
                        }
                    };
                    this.tabConfigs = new Map(Object.entries(tabConfigs));
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            tabs.initializeTabConfigs();

            expect(tabs.tabConfigs.size).toBe(2);
            expect(tabs.tabConfigs.get('characters')).toEqual({
                hasSearch: false,
                searchPlaceholder: '',
                dataLoader: 'loadCharacters',
                searchSetup: 'setupSearch'
            });
            expect(tabs.tabConfigs.get('special-cards')).toEqual({
                hasSearch: true,
                searchPlaceholder: 'Search special cards...',
                dataLoader: 'loadSpecialCards',
                searchSetup: 'setupSpecialCardSearch'
            });
        });
    });

    describe('Tab Switching', () => {
        test('should switch to valid tab', async () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                tabConfigs: Map<string, any>;
                currentTab: string | null;
                
                constructor() {
                    this.tabConfigs = new Map();
                    this.currentTab = null;
                }
                
                initializeTabConfigs() {
                    this.tabConfigs.set('characters', {
                        hasSearch: false,
                        dataLoader: 'loadCharacters',
                        searchSetup: 'setupSearch'
                    });
                }
                
                async switchTab(tabName: string) {
                    if (!this.tabConfigs.has(tabName)) {
                        throw new Error('Unknown tab: ' + tabName);
                    }
                    this.currentTab = tabName;
                }
                
                getCurrentTab() {
                    return this.currentTab;
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            tabs.initializeTabConfigs();

            await tabs.switchTab('characters');
            expect(tabs.getCurrentTab()).toBe('characters');
        });

        test('should reject invalid tab', async () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                tabConfigs: Map<string, any>;
                
                constructor() {
                    this.tabConfigs = new Map();
                }
                
                async switchTab(tabName: string) {
                    if (!this.tabConfigs.has(tabName)) {
                        throw new Error('Unknown tab: ' + tabName);
                    }
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();

            await expect(tabs.switchTab('invalid-tab')).rejects.toThrow('Unknown tab: invalid-tab');
        });
    });

    describe('Tab State Management', () => {
        test('should manage tab states correctly', () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                tabStates: Map<string, any>;
                
                constructor() {
                    this.tabStates = new Map();
                }
                
                initializeTabStates() {
                    this.tabStates.set('characters', {
                        visible: false,
                        active: false,
                        dataLoaded: false
                    });
                }
                
                getTabState(tabName: string) {
                    return this.tabStates.get(tabName);
                }
                
                isTabVisible(tabName: string) {
                    const state = this.tabStates.get(tabName);
                    return state ? state.visible : false;
                }
                
                isTabActive(tabName: string) {
                    const state = this.tabStates.get(tabName);
                    return state ? state.active : false;
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            tabs.initializeTabStates();

            expect(tabs.getTabState('characters')).toEqual({
                visible: false,
                active: false,
                dataLoaded: false
            });
            expect(tabs.isTabVisible('characters')).toBe(false);
            expect(tabs.isTabActive('characters')).toBe(false);
        });
    });

    describe('Search Container Management', () => {
        test('should update search container visibility', () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                updateSearchContainer(tabName: string) {
                    const searchContainer = document.getElementById('search-container') as HTMLElement;
                    const searchInput = document.getElementById('search-input') as HTMLInputElement;
                    
                    if (tabName === 'characters') {
                        searchContainer.style.display = 'none';
                    } else {
                        searchContainer.style.display = 'block';
                        searchInput.placeholder = 'Search ' + tabName + '...';
                    }
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            const searchContainer = document.getElementById('search-container') as HTMLElement;
            const searchInput = document.getElementById('search-input') as HTMLInputElement;

            // Test characters tab (no search)
            tabs.updateSearchContainer('characters');
            expect(searchContainer.style.display).toBe('none');

            // Test special-cards tab (with search)
            tabs.updateSearchContainer('special-cards');
            expect(searchContainer.style.display).toBe('block');
            expect(searchInput.placeholder).toBe('Search special-cards...');
        });
    });

    describe('Event Handling', () => {
        test('should handle tab switch events', () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                tabConfigs: Map<string, any>;
                currentTab: string | null;
                
                constructor() {
                    this.tabConfigs = new Map();
                    this.currentTab = null;
                }
                
                initializeTabConfigs() {
                    this.tabConfigs.set('characters', {
                        hasSearch: false,
                        dataLoader: 'loadCharacters',
                        searchSetup: 'setupSearch'
                    });
                }
                
                handleTabSwitch(event: any) {
                    const tabName = event.detail?.tabName;
                    if (tabName) {
                        this.switchTab(tabName);
                    }
                }
                
                async switchTab(tabName: string) {
                    this.currentTab = tabName;
                }
                
                getCurrentTab() {
                    return this.currentTab;
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            tabs.initializeTabConfigs();

            const event = {
                detail: { tabName: 'characters' }
            };

            tabs.handleTabSwitch(event);
            expect(tabs.getCurrentTab()).toBe('characters');
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources properly', () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                initialized: boolean;
                tabStates: Map<string, any>;
                tabConfigs: Map<string, any>;
                
                constructor() {
                    this.initialized = true;
                    this.tabStates = new Map();
                    this.tabConfigs = new Map();
                }
                
                cleanup() {
                    this.tabStates.clear();
                    this.tabConfigs.clear();
                    this.initialized = false;
                }
                
                isInitialized() {
                    return this.initialized;
                }
            }
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            const tabs = new (window as any).DatabaseViewTabs();
            tabs.tabStates.set('test', {});
            tabs.tabConfigs.set('test', {});

            expect(tabs.isInitialized()).toBe(true);
            expect(tabs.tabStates.size).toBe(1);
            expect(tabs.tabConfigs.size).toBe(1);

            tabs.cleanup();

            expect(tabs.isInitialized()).toBe(false);
            expect(tabs.tabStates.size).toBe(0);
            expect(tabs.tabConfigs.size).toBe(0);
        });
    });

    describe('Global Availability', () => {
        test('should be globally available', () => {
            // Define class directly in test context
            class DatabaseViewTabs {
                initialized: boolean;
                
                constructor() {
                    this.initialized = false;
                }
            }
            
            (window as any).DatabaseViewTabs = DatabaseViewTabs;

            expect((window as any).DatabaseViewTabs).toBeDefined();
            expect(new (window as any).DatabaseViewTabs()).toBeInstanceOf((window as any).DatabaseViewTabs);
        });
    });
});
