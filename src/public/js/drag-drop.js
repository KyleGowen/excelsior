// Drag and drop module
class DragDrop {
    constructor(deckManager) {
        this.deckManager = deckManager;
    }

    // Initialize drag and drop
    initialize() {
        this.setupDeckDropZone();
        this.setupCardDragEvents();
    }

    // Setup deck drop zone
    setupDeckDropZone() {
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        if (!deckCardsEditor) return;

        // Drag over effects
        deckCardsEditor.addEventListener('dragover', (e) => {
            e.preventDefault();
            deckCardsEditor.classList.add('drag-over');
        });

        deckCardsEditor.addEventListener('dragleave', (e) => {
            // Only remove class if leaving the drop zone entirely
            if (!deckCardsEditor.contains(e.relatedTarget)) {
                deckCardsEditor.classList.remove('drag-over');
            }
        });

        // Drop handling
        deckCardsEditor.addEventListener('drop', (e) => {
            e.preventDefault();
            deckCardsEditor.classList.remove('drag-over');
            
            const cardType = e.dataTransfer.getData('text/plain').split('|')[0];
            const cardId = e.dataTransfer.getData('text/plain').split('|')[1];
            const cardName = e.dataTransfer.getData('text/plain').split('|')[2];
            
            if (cardType && cardId) {
                this.deckManager.addCardToDeck(cardType, cardId, cardName);
            }
        });
    }

    // Setup card drag events
    setupCardDragEvents() {
        // Use event delegation for dynamically added cards
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card-item')) {
                e.target.classList.add('dragging');
                
                const cardType = e.target.dataset.type;
                const cardId = e.target.dataset.id;
                const cardName = e.target.dataset.name;
                
                e.dataTransfer.setData('text/plain', `${cardType}|${cardId}|${cardName}`);
                e.dataTransfer.effectAllowed = 'copy';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('card-item')) {
                e.target.classList.remove('dragging');
            }
        });

        // Make cards draggable
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('card-item')) {
                e.target.draggable = true;
            }
        });
    }

    // Enable drag for card items
    enableDragForCardItems() {
        document.querySelectorAll('.card-item').forEach(item => {
            item.draggable = true;
        });
    }

    // Disable drag for card items
    disableDragForCardItems() {
        document.querySelectorAll('.card-item').forEach(item => {
            item.draggable = false;
        });
    }
}

// Export for use in other modules
window.DragDrop = DragDrop;
