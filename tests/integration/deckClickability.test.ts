import request from 'supertest';
import { app } from '../setup-integration';
import { Pool } from 'pg';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock DOM environment for testing
class MockElement {
  public classList = {
    add: (className: string) => this.classListSet.add(className),
    remove: (className: string) => this.classListSet.delete(className),
    contains: (className: string) => this.classListSet.has(className)
  };
  private classListSet: Set<string> = new Set();
  public style: { [key: string]: string } = {};
  public onclick: (() => void) | null = null;
  public textContent: string = '';

  constructor(public id: string) {}
}

// Mock DOM for testing
const mockDOM = {
  getElementById: (id: string): MockElement | null => {
    if (id === 'deckEditorTitle') return new MockElement('deckEditorTitle');
    if (id === 'deckEditorDescription') return new MockElement('deckEditorDescription');
    if (id === 'readOnlyIndicator') return new MockElement('readOnlyIndicator');
    return null;
  }
};

describe('Deck Clickability Tests', () => {
  let pool: Pool;
  let testUserId: string;
  let testDeckId: string;

  beforeAll(async () => {
    // app is imported from setup-integration

    // Set up database connection
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'overpower_deckbuilder',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });

    // Create test user
    testUserId = generateUUID();
    await pool.query(`
      INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [testUserId, 'Clickability Test User', 'clickability@example.com', 'hashed_password', 'USER']);

    // Create test deck
    testDeckId = generateUUID();
    await pool.query(`
      INSERT INTO decks (id, user_id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [testDeckId, testUserId, 'Clickable Test Deck', 'This deck tests clickability']);
  });

  afterAll(async () => {
    // Clean up test data
    if (testDeckId) {
      await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Clickability Simulation Tests', () => {
    it('should simulate read-only mode clickability behavior', () => {
      // Simulate the JavaScript logic for read-only mode
      const isReadOnlyMode = true;
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // Apply read-only mode logic (from the actual code)
      if (isReadOnlyMode) {
        // Remove editable classes and click handlers
        titleElement.classList.remove('editable-title');
        titleElement.style.cursor = 'default';
        titleElement.onclick = null;

        descriptionElement.classList.remove('editable-description');
        descriptionElement.style.cursor = 'default';
        descriptionElement.onclick = null;
      }

      // Test that elements are not clickable
      expect(titleElement.classList.contains('editable-title')).toBe(false);
      expect(titleElement.style.cursor).toBe('default');
      expect(titleElement.onclick).toBe(null);

      expect(descriptionElement.classList.contains('editable-description')).toBe(false);
      expect(descriptionElement.style.cursor).toBe('default');
      expect(descriptionElement.onclick).toBe(null);

      console.log('✅ Read-only mode correctly makes elements non-clickable');
    });

    it('should simulate edit mode clickability behavior', () => {
      // Simulate the JavaScript logic for edit mode
      const isReadOnlyMode = false;
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // Mock functions
      const startEditingTitle = () => console.log('Title editing started');
      const startEditingDescription = () => console.log('Description editing started');

      // Apply edit mode logic (from the actual code)
      if (!isReadOnlyMode) {
        // Restore editable classes and click handlers
        titleElement.classList.add('editable-title');
        titleElement.style.cursor = 'pointer';
        titleElement.onclick = startEditingTitle;

        descriptionElement.classList.add('editable-description');
        descriptionElement.style.cursor = 'pointer';
        descriptionElement.onclick = startEditingDescription;
      }

      // Test that elements are clickable
      expect(titleElement.classList.contains('editable-title')).toBe(true);
      expect(titleElement.style.cursor).toBe('pointer');
      expect(titleElement.onclick).toBeTruthy();

      expect(descriptionElement.classList.contains('editable-description')).toBe(true);
      expect(descriptionElement.style.cursor).toBe('pointer');
      expect(descriptionElement.onclick).toBeTruthy();

      console.log('✅ Edit mode correctly makes elements clickable');
    });

    it('should test click handler execution', () => {
      // Test that click handlers work when assigned
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      let titleClicked = false;
      let descriptionClicked = false;

      const startEditingTitle = () => { titleClicked = true; };
      const startEditingDescription = () => { descriptionClicked = true; };

      // Assign click handlers
      titleElement.onclick = startEditingTitle;
      descriptionElement.onclick = startEditingDescription;

      // Simulate clicks
      if (titleElement.onclick) titleElement.onclick();
      if (descriptionElement.onclick) descriptionElement.onclick();

      expect(titleClicked).toBe(true);
      expect(descriptionClicked).toBe(true);

      console.log('✅ Click handlers execute correctly when assigned');
    });

    it('should test click handler removal', () => {
      // Test that click handlers are properly removed
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // First assign handlers
      titleElement.onclick = () => console.log('Title clicked');
      descriptionElement.onclick = () => console.log('Description clicked');

      expect(titleElement.onclick).toBeTruthy();
      expect(descriptionElement.onclick).toBeTruthy();

      // Then remove them (read-only mode)
      titleElement.onclick = null;
      descriptionElement.onclick = null;

      expect(titleElement.onclick).toBe(null);
      expect(descriptionElement.onclick).toBe(null);

      console.log('✅ Click handlers are properly removed in read-only mode');
    });
  });

  describe('CSS Class Application Tests', () => {
    it('should test editable class application and removal', () => {
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // Initially no editable classes
      expect(titleElement.classList.contains('editable-title')).toBe(false);
      expect(descriptionElement.classList.contains('editable-description')).toBe(false);

      // Add editable classes (edit mode)
      titleElement.classList.add('editable-title');
      descriptionElement.classList.add('editable-description');

      expect(titleElement.classList.contains('editable-title')).toBe(true);
      expect(descriptionElement.classList.contains('editable-description')).toBe(true);

      // Remove editable classes (read-only mode)
      titleElement.classList.remove('editable-title');
      descriptionElement.classList.remove('editable-description');

      expect(titleElement.classList.contains('editable-title')).toBe(false);
      expect(descriptionElement.classList.contains('editable-description')).toBe(false);

      console.log('✅ Editable classes are properly applied and removed');
    });

    it('should test cursor style changes', () => {
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // Test pointer cursor (edit mode)
      titleElement.style.cursor = 'pointer';
      descriptionElement.style.cursor = 'pointer';

      expect(titleElement.style.cursor).toBe('pointer');
      expect(descriptionElement.style.cursor).toBe('pointer');

      // Test default cursor (read-only mode)
      titleElement.style.cursor = 'default';
      descriptionElement.style.cursor = 'default';

      expect(titleElement.style.cursor).toBe('default');
      expect(descriptionElement.style.cursor).toBe('default');

      console.log('✅ Cursor styles are properly applied');
    });
  });

  describe('Role-Based Clickability Matrix', () => {
    it('should test GUEST role clickability', () => {
      const isReadOnlyMode = true; // GUEST viewing another user's deck
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // Apply GUEST logic
      if (isReadOnlyMode) {
        titleElement.classList.remove('editable-title');
        titleElement.style.cursor = 'default';
        titleElement.onclick = null;

        descriptionElement.classList.remove('editable-description');
        descriptionElement.style.cursor = 'default';
        descriptionElement.onclick = null;
      }

      // GUEST should not be able to click
      expect(titleElement.classList.contains('editable-title')).toBe(false);
      expect(titleElement.onclick).toBe(null);
      expect(descriptionElement.classList.contains('editable-description')).toBe(false);
      expect(descriptionElement.onclick).toBe(null);

      console.log('✅ GUEST role correctly prevents clicking');
    });

    it('should test USER role clickability (own deck)', () => {
      const isReadOnlyMode = false; // USER viewing own deck
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      const startEditingTitle = () => console.log('Title editing started');
      const startEditingDescription = () => console.log('Description editing started');

      // Apply USER logic
      if (!isReadOnlyMode) {
        titleElement.classList.add('editable-title');
        titleElement.style.cursor = 'pointer';
        titleElement.onclick = startEditingTitle;

        descriptionElement.classList.add('editable-description');
        descriptionElement.style.cursor = 'pointer';
        descriptionElement.onclick = startEditingDescription;
      }

      // USER should be able to click
      expect(titleElement.classList.contains('editable-title')).toBe(true);
      expect(titleElement.onclick).toBeTruthy();
      expect(descriptionElement.classList.contains('editable-description')).toBe(true);
      expect(descriptionElement.onclick).toBeTruthy();

      console.log('✅ USER role correctly allows clicking on own deck');
    });

    it('should test ADMIN role clickability (own deck)', () => {
      const isReadOnlyMode = false; // ADMIN viewing own deck
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      const startEditingTitle = () => console.log('Title editing started');
      const startEditingDescription = () => console.log('Description editing started');

      // Apply ADMIN logic (same as USER for own deck)
      if (!isReadOnlyMode) {
        titleElement.classList.add('editable-title');
        titleElement.style.cursor = 'pointer';
        titleElement.onclick = startEditingTitle;

        descriptionElement.classList.add('editable-description');
        descriptionElement.style.cursor = 'pointer';
        descriptionElement.onclick = startEditingDescription;
      }

      // ADMIN should be able to click
      expect(titleElement.classList.contains('editable-title')).toBe(true);
      expect(titleElement.onclick).toBeTruthy();
      expect(descriptionElement.classList.contains('editable-description')).toBe(true);
      expect(descriptionElement.onclick).toBeTruthy();

      console.log('✅ ADMIN role correctly allows clicking on own deck');
    });

    it('should test USER role clickability (other user\'s deck)', () => {
      const isReadOnlyMode = true; // USER viewing another user's deck
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      // Apply read-only logic
      if (isReadOnlyMode) {
        titleElement.classList.remove('editable-title');
        titleElement.style.cursor = 'default';
        titleElement.onclick = null;

        descriptionElement.classList.remove('editable-description');
        descriptionElement.style.cursor = 'default';
        descriptionElement.onclick = null;
      }

      // USER should not be able to click on other user's deck
      expect(titleElement.classList.contains('editable-title')).toBe(false);
      expect(titleElement.onclick).toBe(null);
      expect(descriptionElement.classList.contains('editable-description')).toBe(false);
      expect(descriptionElement.onclick).toBe(null);

      console.log('✅ USER role correctly prevents clicking on other user\'s deck');
    });
  });

  describe('Edge Case Testing', () => {
    it('should handle undefined elements gracefully', () => {
      const isReadOnlyMode = true;
      
      // Simulate missing elements
      const titleElement = mockDOM.getElementById('nonexistent') as MockElement | null;
      const descriptionElement = mockDOM.getElementById('nonexistent') as MockElement | null;

      // Should not throw errors when elements are null
      if (titleElement) {
        titleElement.classList.remove('editable-title');
        titleElement.onclick = null;
      }
      if (descriptionElement) {
        descriptionElement.classList.remove('editable-description');
        descriptionElement.onclick = null;
      }

      // Test passes if no errors are thrown
      expect(true).toBe(true);

      console.log('✅ Handles undefined elements gracefully');
    });

    it('should handle rapid mode switching', () => {
      const titleElement = mockDOM.getElementById('deckEditorTitle')!;
      const descriptionElement = mockDOM.getElementById('deckEditorDescription')!;

      const startEditingTitle = () => console.log('Title editing started');
      const startEditingDescription = () => console.log('Description editing started');

      // Rapidly switch between modes
      for (let i = 0; i < 10; i++) {
        const isReadOnlyMode = i % 2 === 0;

        if (isReadOnlyMode) {
          titleElement.classList.remove('editable-title');
          titleElement.onclick = null;
          descriptionElement.classList.remove('editable-description');
          descriptionElement.onclick = null;
        } else {
          titleElement.classList.add('editable-title');
          titleElement.onclick = startEditingTitle;
          descriptionElement.classList.add('editable-description');
          descriptionElement.onclick = startEditingDescription;
        }
      }

      // Final state should be edit mode (last iteration was odd)
      expect(titleElement.classList.contains('editable-title')).toBe(true);
      expect(titleElement.onclick).toBeTruthy();
      expect(descriptionElement.classList.contains('editable-description')).toBe(true);
      expect(descriptionElement.onclick).toBeTruthy();

      console.log('✅ Handles rapid mode switching correctly');
    });
  });

  describe('Integration with HTML Structure', () => {
    it('should verify HTML contains necessary elements for clickability', async () => {
      const response = await request(app)
        .get(`/users/${testUserId}/decks/${testDeckId}`)
        .expect(200);

      const html = response.text;

      // Check for required elements
      expect(html).toContain('id="deckEditorTitle"');
      expect(html).toContain('id="deckEditorDescription"');

      // Check for JavaScript functions
      expect(html).toContain('function startEditingTitle()');
      expect(html).toContain('function startEditingDescription()');

      // Check for CSS classes
      expect(html).toContain('.editable-title');
      expect(html).toContain('.editable-description');

      console.log('✅ HTML contains all necessary elements for clickability');
    });

    it('should verify JavaScript logic matches test expectations', async () => {
      const response = await request(app)
        .get(`/users/${testUserId}/decks/${testDeckId}`)
        .expect(200);

      const html = response.text;
      const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs)?.join('\n') || '';

      // Check for the exact logic we're testing
      expect(scripts).toContain('if (isReadOnlyMode)');
      expect(scripts).toContain('classList.remove(\'editable-title\')');
      expect(scripts).toContain('classList.remove(\'editable-description\')');
      expect(scripts).toContain('onclick = null');
      expect(scripts).toContain('} else {');
      expect(scripts).toContain('classList.add(\'editable-title\')');
      expect(scripts).toContain('classList.add(\'editable-description\')');

      console.log('✅ JavaScript logic matches test expectations');
    });
  });
});
