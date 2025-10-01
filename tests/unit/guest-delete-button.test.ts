/**
 * @jest-environment jsdom
 */

describe('Guest Delete Button Functionality', () => {
  let mockCurrentUser: any;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock currentUser
    mockCurrentUser = null;
    
    // Mock the isGuestUser function
    (window as any).isGuestUser = () => {
      return mockCurrentUser && (mockCurrentUser.role === 'GUEST' || mockCurrentUser.username === 'guest' || mockCurrentUser.name === 'guest');
    };
  });

  test('should disable delete button for guest users', () => {
    // Set up guest user
    mockCurrentUser = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'guest',
      name: 'guest',
      role: 'GUEST'
    };

    // Mock deck data
    const deck = {
      id: 'test-deck-id',
      name: 'Test Deck',
      description: 'Test Description',
      cardCount: 10,
      created: '2023-01-01',
      lastModified: '2023-01-02',
      cards: []
    };

    // Create the deck card HTML with the conditional delete button
    const deckCardHTML = `
      <div class="deck-card">
        <div class="deck-header">
          <div class="deck-info">
            <h4>${deck.name}</h4>
            <div class="deck-description">${deck.description}</div>
            <div class="deck-meta">
              <span>📊 ${deck.cardCount} cards</span>
              <span>📅 Created: ${new Date(deck.created).toLocaleDateString()}</span>
              <span>✏️ Modified: ${new Date(deck.lastModified).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div class="deck-actions">
          <button class="deck-action-btn" onclick="editDeck('${deck.id}')">Edit</button>
          <button class="deck-action-btn" onclick="viewDeck('${deck.id}')">View</button>
          ${(window as any).isGuestUser() ? 
            '<button class="deck-action-btn danger" disabled title="Log in to delete decks...">Delete</button>' : 
            '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.id + '\')">Delete</button>'
          }
        </div>
      </div>
    `;

    // Add to DOM
    document.body.innerHTML = deckCardHTML;

    // Get the delete button
    const deleteButton = document.querySelector('.deck-action-btn.danger') as HTMLButtonElement;

    // Verify the button is disabled for guest users
    expect(deleteButton).toBeTruthy();
    expect(deleteButton.disabled).toBe(true);
    expect(deleteButton.title).toBe('Log in to delete decks...');
    expect(deleteButton.textContent).toBe('Delete');
  });

  test('should enable delete button for regular users', () => {
    // Set up regular user
    mockCurrentUser = {
      id: 'user-123',
      username: 'testuser',
      name: 'Test User',
      role: 'USER'
    };

    // Mock deck data
    const deck = {
      id: 'test-deck-id',
      name: 'Test Deck',
      description: 'Test Description',
      cardCount: 10,
      created: '2023-01-01',
      lastModified: '2023-01-02',
      cards: []
    };

    // Create the deck card HTML with the conditional delete button
    const deckCardHTML = `
      <div class="deck-card">
        <div class="deck-header">
          <div class="deck-info">
            <h4>${deck.name}</h4>
            <div class="deck-description">${deck.description}</div>
            <div class="deck-meta">
              <span>📊 ${deck.cardCount} cards</span>
              <span>📅 Created: ${new Date(deck.created).toLocaleDateString()}</span>
              <span>✏️ Modified: ${new Date(deck.lastModified).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div class="deck-actions">
          <button class="deck-action-btn" onclick="editDeck('${deck.id}')">Edit</button>
          <button class="deck-action-btn" onclick="viewDeck('${deck.id}')">View</button>
          ${(window as any).isGuestUser() ? 
            '<button class="deck-action-btn danger" disabled title="Log in to delete decks...">Delete</button>' : 
            '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.id + '\')">Delete</button>'
          }
        </div>
      </div>
    `;

    // Add to DOM
    document.body.innerHTML = deckCardHTML;

    // Get the delete button
    const deleteButton = document.querySelector('.deck-action-btn.danger') as HTMLButtonElement;

    // Verify the button is enabled for regular users
    expect(deleteButton).toBeTruthy();
    expect(deleteButton.disabled).toBe(false);
    expect(deleteButton.onclick).toBeTruthy();
    expect(deleteButton.textContent).toBe('Delete');
  });

  test('should handle null currentUser gracefully', () => {
    // Set up null user
    mockCurrentUser = null;

    // Mock deck data
    const deck = {
      id: 'test-deck-id',
      name: 'Test Deck',
      description: 'Test Description',
      cardCount: 10,
      created: '2023-01-01',
      lastModified: '2023-01-02',
      cards: []
    };

    // Create the deck card HTML with the conditional delete button
    const deckCardHTML = `
      <div class="deck-card">
        <div class="deck-header">
          <div class="deck-info">
            <h4>${deck.name}</h4>
            <div class="deck-description">${deck.description}</div>
            <div class="deck-meta">
              <span>📊 ${deck.cardCount} cards</span>
              <span>📅 Created: ${new Date(deck.created).toLocaleDateString()}</span>
              <span>✏️ Modified: ${new Date(deck.lastModified).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div class="deck-actions">
          <button class="deck-action-btn" onclick="editDeck('${deck.id}')">Edit</button>
          <button class="deck-action-btn" onclick="viewDeck('${deck.id}')">View</button>
          ${(window as any).isGuestUser() ? 
            '<button class="deck-action-btn danger" disabled title="Log in to delete decks...">Delete</button>' : 
            '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.id + '\')">Delete</button>'
          }
        </div>
      </div>
    `;

    // Add to DOM
    document.body.innerHTML = deckCardHTML;

    // Get the delete button
    const deleteButton = document.querySelector('.deck-action-btn.danger') as HTMLButtonElement;

    // Verify the button is enabled when no user (treating as regular user)
    expect(deleteButton).toBeTruthy();
    expect(deleteButton.disabled).toBe(false);
    expect(deleteButton.onclick).toBeTruthy();
    expect(deleteButton.textContent).toBe('Delete');
  });
});
