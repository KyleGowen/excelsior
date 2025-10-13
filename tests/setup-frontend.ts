// Frontend test setup for jsdom environment
// Mock DOM elements
const mockElement: any = {
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
  innerHTML: '',
  textContent: '',
  value: '',
  checked: false,
  disabled: false,
  hidden: false,
  id: '',
  className: '',
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  createElement: jest.fn(() => mockElement),
};

// Mock document
const mockDocument: any = {
  getElementById: jest.fn(() => mockElement),
  querySelector: jest.fn(() => mockElement),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => mockElement),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  body: mockElement,
  head: mockElement,
  title: 'Test',
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
};

// Mock window
const mockWindow: any = {
  document: mockDocument,
  location: mockDocument.location,
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  fetch: jest.fn(),
  setTimeout: jest.fn((fn: Function, delay: number) => setTimeout(fn, delay)),
  clearTimeout: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  alert: jest.fn(),
  confirm: jest.fn(),
  prompt: jest.fn(),
};

// Set up global objects
global.window = mockWindow as any;
global.document = mockDocument as any;
global.HTMLElement = mockElement as any;
global.Element = mockElement as any;
global.Node = mockElement as any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  mockWindow.localStorage.getItem.mockClear();
  mockWindow.localStorage.setItem.mockClear();
  mockWindow.localStorage.removeItem.mockClear();
  mockWindow.localStorage.clear.mockClear();
  mockWindow.sessionStorage.getItem.mockClear();
  mockWindow.sessionStorage.setItem.mockClear();
  mockWindow.sessionStorage.removeItem.mockClear();
  mockWindow.sessionStorage.clear.mockClear();
});
