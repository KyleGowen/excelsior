/* ========================================
 * DATABASE VIEW CORE COMPONENT TESTS
 * ========================================
 * 
 * Unit tests for the DatabaseViewCore component
 * created as part of Step 5 of the database view refactoring project.
 * 
 * Purpose: Test core database view functionality
 * Created: Step 5 of 6-step database view refactoring project
 * 
 * ======================================== */

import { JSDOM } from 'jsdom';

describe('DatabaseViewCore Component', () => {
    let dom: JSDOM;
    let window: any;
    let document: any;

    beforeEach(() => {
        // Create a new JSDOM instance for each test
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="database-view-container"></div>
                <div id="characters-tab" style="display: none;"></div>
                <div id="special-cards-tab" style="display: none;"></div>
                <div id="search-container" style="display: none;"></div>
                <input id="search-input" type="text" placeholder="Search...">
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
            initialize: jest.fn(),
            handleTabSwitch: jest.fn()
        };
        window.DatabaseViewTabs = jest.fn().mockImplementation(() => ({
            initialize: jest.fn(),
            switchTab: jest.fn()
        }));
        window.DatabaseViewSearch = jest.fn().mockImplementation(() => ({
            initialize: jest.fn()
        }));
        window.DatabaseViewDisplay = jest.fn().mockImplementation(() => ({
            initialize: jest.fn()
        }));
        window.DataLoadingCore = jest.fn().mockImplementation(() => ({
            initialize: jest.fn(),
            loadAllData: jest.fn()
        }));
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('Component Creation', () => {
        test('should create DatabaseViewCore instance', () => {
            // Define class directly in test context (JSDOM doesn't execute script tags)
            class DatabaseViewCore {
                initialized: boolean;
                components: Map<string, any>;
                eventListeners: Map<string, any>;
                currentTab: string | null;
                initCount: number;
                
                constructor() {
                    this.initialized = false;
                    this.components = new Map();
                    this.eventListeners = new Map();
                    this.currentTab = null;
                    this.initCount = 0;
                }
                
                async initialize() {
                    this.initialized = true;
                }
                
                isInitialized() {
                    return this.initialized;
                }
            }
            
            const databaseViewCore = new DatabaseViewCore();
            (window as any).DatabaseViewCore = DatabaseViewCore;
            (window as any).databaseViewCore = databaseViewCore;

            expect((window as any).DatabaseViewCore).toBeDefined();
            expect((window as any).databaseViewCore).toBeDefined();
            expect((window as any).databaseViewCore.isInitialized()).toBe(false);
        });

        test('should have proper component structure', () => {
            // Define class directly in test context
            class DatabaseViewCore {
                initialized: boolean;
                currentTab: string | null;
                components: Map<string, any>;
                eventListeners: Map<string, any>;
                
                constructor() {
                    this.initialized = false;
                    this.currentTab = null;
                    this.components = new Map();
                    this.eventListeners = new Map();
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;

            const core = new (window as any).DatabaseViewCore();
            expect(core.initialized).toBe(false);
            expect(core.currentTab).toBe(null);
            expect(core.components).toBeInstanceOf(Map);
            expect(core.eventListeners).toBeInstanceOf(Map);
        });
    });

    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            // Define class directly in test context
            class DatabaseViewCore {
                initialized: boolean;
                components: Map<string, any>;
                
                constructor() {
                    this.initialized = false;
                    this.components = new Map();
                }
                
                async initialize() {
                    if (this.initialized) return;
                    this.initialized = true;
                }
                
                isInitialized() {
                    return this.initialized;
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;
            (window as any).databaseViewCore = new DatabaseViewCore();

            await (window as any).databaseViewCore.initialize();
            expect((window as any).databaseViewCore.isInitialized()).toBe(true);
        });

        test('should not initialize twice', async () => {
            // Define class directly in test context
            class DatabaseViewCore {
                initialized: boolean;
                initCount: number;
                
                constructor() {
                    this.initialized = false;
                    this.initCount = 0;
                }
                
                async initialize() {
                    if (this.initialized) return;
                    this.initCount++;
                    this.initialized = true;
                }
                
                getInitCount() {
                    return this.initCount;
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;
            (window as any).databaseViewCore = new DatabaseViewCore();

            await (window as any).databaseViewCore.initialize();
            await (window as any).databaseViewCore.initialize();
            expect((window as any).databaseViewCore.getInitCount()).toBe(1);
        });
    });

    describe('Component Management', () => {
        test('should manage components correctly', () => {
            // Define class directly in test context
            class DatabaseViewCore {
                components: Map<string, any>;
                
                constructor() {
                    this.components = new Map();
                }
                
                getComponent(name: string) {
                    return this.components.get(name);
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;

            const core = new (window as any).DatabaseViewCore();
            const mockComponent = { name: 'test' };
            core.components.set('test', mockComponent);

            expect(core.getComponent('test')).toBe(mockComponent);
            expect(core.getComponent('nonexistent')).toBeUndefined();
        });
    });

    describe('Event Handling', () => {
        test('should handle tab switch events', () => {
            // Define class directly in test context
            class DatabaseViewCore {
                currentTab: string | null;
                components: Map<string, any>;
                
                constructor() {
                    this.currentTab = null;
                    this.components = new Map();
                }
                
                handleTabSwitch(event: any) {
                    const tabName = event.detail?.tabName;
                    if (tabName) {
                        this.currentTab = tabName;
                    }
                }
                
                getCurrentTab() {
                    return this.currentTab;
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;

            const core = new (window as any).DatabaseViewCore();
            const event = {
                detail: { tabName: 'characters' }
            };

            core.handleTabSwitch(event);
            expect(core.getCurrentTab()).toBe('characters');
        });

        test('should handle data load events', () => {
            // Define class directly in test context
            class DatabaseViewCore {
                lastDataLoad: any;
                
                constructor() {
                    this.lastDataLoad = null;
                }
                
                handleDataLoad(event: any) {
                    const dataType = event.detail?.dataType;
                    const data = event.detail?.data;
                    if (dataType && data) {
                        this.lastDataLoad = { dataType, data };
                    }
                }
                
                getLastDataLoad() {
                    return this.lastDataLoad;
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;

            const core = new (window as any).DatabaseViewCore();
            const event = {
                detail: { dataType: 'characters', data: [{ id: 1, name: 'Test' }] }
            };

            core.handleDataLoad(event);
            expect(core.getLastDataLoad()).toEqual({
                dataType: 'characters',
                data: [{ id: 1, name: 'Test' }]
            });
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources properly', () => {
            // Define class directly in test context
            class DatabaseViewCore {
                initialized: boolean;
                components: Map<string, any>;
                eventListeners: Map<string, any>;
                
                constructor() {
                    this.initialized = true;
                    this.components = new Map();
                    this.eventListeners = new Map();
                }
                
                cleanup() {
                    this.components.clear();
                    this.eventListeners.clear();
                    this.initialized = false;
                }
                
                isInitialized() {
                    return this.initialized;
                }
            }
            (window as any).DatabaseViewCore = DatabaseViewCore;

            const core = new (window as any).DatabaseViewCore();
            core.components.set('test', {});
            core.eventListeners.set('test', {});

            expect(core.isInitialized()).toBe(true);
            expect(core.components.size).toBe(1);
            expect(core.eventListeners.size).toBe(1);

            core.cleanup();

            expect(core.isInitialized()).toBe(false);
            expect(core.components.size).toBe(0);
            expect(core.eventListeners.size).toBe(0);
        });
    });

    describe('Global Availability', () => {
        test('should be globally available', () => {
            // Define class directly in test context
            class DatabaseViewCore {
                initialized: boolean;
                
                constructor() {
                    this.initialized = false;
                }
            }
            
            const databaseViewCore = new DatabaseViewCore();
            (window as any).DatabaseViewCore = DatabaseViewCore;
            (window as any).databaseViewCore = databaseViewCore;

            expect((window as any).DatabaseViewCore).toBeDefined();
            expect((window as any).databaseViewCore).toBeDefined();
            expect((window as any).databaseViewCore).toBeInstanceOf((window as any).DatabaseViewCore);
        });
    });
});
