// Deck Management Functions
// Extracted from index.html as part of Phase 10D refactoring

// Deck management functions
function addCharacterToDeck() {
    const characterSelect = document.getElementById('characterSelect');
    const selectedValue = characterSelect.value;
    
    if (!selectedValue) return;
    
    // Check if character is already selected
    if (selectedCharacterIds.includes(selectedValue)) {
        alert('This character is already selected!');
        return;
    }
    
    // Check if we already have 4 characters
    if (selectedCharacterIds.length >= 4) {
        alert('You can only select up to 4 characters!');
        return;
    }
    
    const selectedText = characterSelect.options[characterSelect.selectedIndex].text;
    selectedCharacterIds.push(selectedValue);
    
    // Add character tag to display
    const selectedCharactersDiv = document.getElementById('selectedCharacters');
    const characterTag = document.createElement('div');
    characterTag.className = 'character-tag';
    characterTag.innerHTML = `
        <span>${selectedText}</span>
        <button type="button" class="remove-btn" onclick="removeCharacterFromDeck('${selectedValue}')">×</button>
    `;
    selectedCharactersDiv.appendChild(characterTag);
    
    // Reset dropdown
    characterSelect.value = '';
}

function removeCharacterFromDeck(characterId) {
    selectedCharacterIds = selectedCharacterIds.filter(id => id !== characterId);
    
    // Remove character tag from display
    const selectedCharactersDiv = document.getElementById('selectedCharacters');
    const tags = selectedCharactersDiv.querySelectorAll('.character-tag');
    tags.forEach(tag => {
        const removeBtn = tag.querySelector('.remove-btn');
        if (removeBtn && removeBtn.onclick.toString().includes(characterId)) {
            tag.remove();
        }
    });
}

function editDeck(deckId) {
    
    // Get current user to determine read-only mode
    const currentUser = getCurrentUser();
    const isReadOnly = false; // User is editing their own deck
    
    // Hide login modal immediately to prevent flash
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    
    // Show main container if it's hidden
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
    
    // Update URL to include the deck ID for sharing
    const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
    const newUrl = `/users/${userId}/decks/${deckId}`;
    window.history.pushState({ deckId, userId }, '', newUrl);
    
    // Load and show the deck editor directly without page reload
    loadDeckForEditing(deckId, userId, isReadOnly)
        .then(() => {
            showDeckEditor();
        })
        .catch(error => {
            console.error('Error loading deck for editing:', error);
            // Fallback to URL navigation if direct loading fails
            if (currentUser) {
                window.location.href = `/users/${currentUser.userId}/decks/${deckId}`;
            } else {
                window.location.href = `/users/guest/decks/${deckId}`;
            }
        });
}

function viewDeck(deckId) {
    
    // Get current user to determine the user ID for the URL
    const currentUser = getCurrentUser();
    const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
    
    // Update URL to include the deck ID for sharing
    const newUrl = `/users/${userId}/decks/${deckId}?readonly=true`;
    window.history.pushState({ deckId, userId, readonly: true }, '', newUrl);
    
    // Navigate to the deck editor in read-only mode
    window.location.href = newUrl;
}

function deleteDeck(deckId) {
    if (confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
        fetch(`/api/decks/${deckId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadDecks(); // Refresh the deck list
                showNotification('Deck deleted successfully!', 'success');
            } else {
                showNotification('Failed to delete deck: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting deck:', error);
            showNotification('Failed to delete deck', 'error');
        });
    }
}

function showViewDeckModal() {
    document.getElementById('viewDeckModal').style.display = 'flex';
}

function closeViewDeckModal() {
    document.getElementById('viewDeckModal').style.display = 'none';
    currentDeckId = null;
}

function showAddCardsModal() {
    document.getElementById('addCardsModal').style.display = 'flex';
    // Load initial card search
    searchCards();
}

function closeAddCardsModal() {
    document.getElementById('addCardsModal').style.display = 'none';
}
