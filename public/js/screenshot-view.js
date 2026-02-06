// screenshot-view.js - Screenshot content generation
// Extracted from public/index.html

// ===== generateScreenshotContent, setupScreenshotDragAndDrop =====

function generateScreenshotContent() {
const screenshotContent = document.getElementById('screenshotViewContent');
if (!screenshotContent) return;

// Filter for character cards only
const characterCards = window.deckEditorCards.filter(card => card.type === 'character');

if (characterCards.length === 0) {
    screenshotContent.innerHTML = '<div class="screenshot-blank-screen">No character cards in deck</div>';
    return;
}

let contentHtml = '<div class="screenshot-draggable-container">';

// Calculate center position for the cards
const containerWidth = 800; // Approximate container width
const containerHeight = 600; // Approximate container height
const cardWidth = 200;
const cardHeight = 140;
const startX = (containerWidth - cardWidth) / 2; // Center horizontally
const startY = (containerHeight - cardHeight) / 2; // Center vertically

characterCards.forEach((cardData, index) => {
    const availableCard = window.availableCardsMap.get(cardData.cardId);
    
    if (availableCard) {
        const imagePath = getCardImagePath(availableCard, cardData.type);
        const quantity = cardData.quantity || 1;
        
        // Create draggable character card centered with slight offset for multiple cards
        contentHtml += `
            <div class="screenshot-draggable-card" 
                 data-card-id="${cardData.cardId}"
                 data-card-type="character"
                 style="left: ${startX + (index * 60)}px; top: ${startY + (index * 40)}px;">
                <div class="screenshot-card-image" style="background-image: url('${imagePath}');"></div>
                ${quantity > 1 ? `<div class="screenshot-card-quantity">${quantity}</div>` : ''}
            </div>
        `;
    }
});

contentHtml += '</div>';
screenshotContent.innerHTML = contentHtml;

// Setup drag and drop for screenshot view
setupScreenshotDragAndDrop();
}

function setupScreenshotDragAndDrop() {
const container = document.querySelector('.screenshot-draggable-container');
if (!container) return;

const gridSize = 50;
// Align snapping origin with the visible grid in .screenshot-view-content
const contentEl = document.querySelector('.screenshot-view-content');
const contentStyle = contentEl ? window.getComputedStyle(contentEl) : null;
// Grid snapping - align to 50px grid starting at 0,0
const gridOffsetX = 0;
const gridOffsetY = 0;
let activeCard = null;
let offsetX = 0;
let offsetY = 0;
let selectionRect = null;
let isMarqueeSelecting = false;
let marqueeStartX = 0;
let marqueeStartY = 0;
let selectedCards = new Set();
let initialPositions = new Map(); // Store initial positions for group dragging

// getCardBounds, clearSelection functions moved to external file

// onPointerMove function moved to external file

// onPointerUp function moved to external file

// attachDragListeners function moved to external file

// Marquee selection on empty space
container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.screenshot-draggable-card')) {
        return; // handled by card listener
    }
    clearSelection();
    const rect = container.getBoundingClientRect();
    marqueeStartX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    marqueeStartY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    selectionRect = document.createElement('div');
    selectionRect.className = 'screenshot-selection-rect';
    selectionRect.style.left = marqueeStartX + 'px';
    selectionRect.style.top = marqueeStartY + 'px';
    selectionRect.style.width = '0px';
    selectionRect.style.height = '0px';
    container.appendChild(selectionRect);
    isMarqueeSelecting = true;
    container.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
});

// Attach drag listeners to any existing cards
attachDragListeners();
}
// View Manager - Clean abstraction layer for view switching

// Export all functions to window for backward compatibility
window.generateScreenshotContent = generateScreenshotContent;
window.setupScreenshotDragAndDrop = setupScreenshotDragAndDrop;
