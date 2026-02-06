/**
 * Deck Background Management Module
 * Handles background image selection for deck editor (all authenticated users)
 */

class DeckBackgroundManager {
  constructor() {
    this.availableBackgrounds = [];
    this.selectedBackground = null;
    this.currentDeckId = null;
    this.modal = null;
  }

  /**
   * Initialize the background manager
   * @param {string} deckId - The deck ID
   * @param {boolean} readOnly - Whether this is read-only/view mode (button won't be shown)
   */
  async initialize(deckId, readOnly = false) {
    this.currentDeckId = deckId;
    
    // Load current deck background (works for all users in view mode)
    await this.loadDeckBackground();
    
    // Apply background to editor (works for all users)
    this.applyBackground();
    
    // Show button and load backgrounds list for all users in edit mode
    if (!readOnly) {
      const currentUser = this.getCurrentUser();
      console.log('Background manager: Current user:', currentUser);
      
      if (!currentUser) {
        console.log('Background manager: No current user found, skipping button creation');
        return;
      }
      
      console.log('Background manager: Initializing for user');

      // Load available backgrounds
      await this.loadBackgrounds();
      
      // Create and setup the button (with retry logic)
      this.createBackgroundButton();
    }
  }

  /**
   * Get current user from global scope
   */
  getCurrentUser() {
    // Try multiple ways to get current user
    if (typeof getCurrentUser === 'function') {
      return getCurrentUser();
    }
    if (window.currentUser) {
      return window.currentUser;
    }
    if (window.deckManager && window.deckManager.currentUser) {
      return window.deckManager.currentUser;
    }
    // Try to get from auth service if available
    if (window.authService && window.authService.currentUser) {
      return window.authService.currentUser;
    }
    return null;
  }

  /**
   * Load available background images from API
   */
  async loadBackgrounds() {
    try {
      const response = await fetch('/api/deck-backgrounds', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.log('Background feature not available: Access denied');
          return;
        }
        throw new Error('Failed to load backgrounds');
      }
      
      const data = await response.json();
      if (data.success) {
        this.availableBackgrounds = data.data;
      }
    } catch (error) {
      console.error('Error loading backgrounds:', error);
    }
  }

  /**
   * Load current deck's background from deck data
   */
  async loadDeckBackground() {
    if (!this.currentDeckId) return;
    
    try {
      const response = await fetch(`/api/decks/${this.currentDeckId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.metadata) {
          const backgroundPath = data.data.metadata.background_image_path || null;
          this.selectedBackground = backgroundPath;
          console.log('Background manager: Loaded background from deck:', backgroundPath);
          // Apply immediately after loading
          this.applyBackground();
        }
      }
    } catch (error) {
      console.error('Error loading deck background:', error);
    }
  }
  
  /**
   * Set background from deck metadata (called when deck data is already loaded)
   */
  setBackgroundFromDeckData(deckMetadata) {
    if (deckMetadata && deckMetadata.background_image_path !== undefined) {
      this.selectedBackground = deckMetadata.background_image_path || null;
      console.log('Background manager: Set background from deck metadata:', this.selectedBackground);
      this.applyBackground();
    }
  }

  /**
   * Create the Background button
   */
  createBackgroundButton() {
    // Check if user exists before creating button
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.log('Background manager: Not creating button - no current user');
      return; // Don't create button if we can't identify a user session
    }

    // Wait for DOM to be ready
    let retryCount = 0;
    const maxRetries = 50; // Try for up to 5 seconds
    
    const tryCreateButton = () => {
      const listViewBtn = document.getElementById('listViewBtn');
      if (!listViewBtn) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Retry after a short delay if button doesn't exist yet
          setTimeout(tryCreateButton, 100);
        } else {
          console.warn('Background manager: List View button not found after', maxRetries, 'retries');
        }
        return;
      }

      // Check if button already exists
      if (document.getElementById('backgroundBtn')) {
        console.log('Background manager: Button already exists');
        return;
      }

      console.log('Background manager: Creating Background button');
      const backgroundBtn = document.createElement('button');
      backgroundBtn.id = 'backgroundBtn';
      backgroundBtn.className = 'remove-all-btn';
      backgroundBtn.textContent = 'Background';
      backgroundBtn.setAttribute('data-click-handler', 'showBackgroundModal');
      backgroundBtn.addEventListener('click', () => this.showBackgroundModal());

      // Insert before listViewBtn
      listViewBtn.parentNode.insertBefore(backgroundBtn, listViewBtn);
      console.log('Background manager: Button created successfully');
    };

    // Start trying to create the button
    tryCreateButton();
  }

  /**
   * Show the Choose Background modal
   */
  async showBackgroundModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      return;
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'background-modal';
    overlay.style.display = 'flex';

    // Create modal content
    const content = document.createElement('div');
    content.className = 'background-modal-content';

    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Choose Background';

    // Create scrollable container for options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'background-options';

    // Create first row with "None" as the first tile
    const firstRow = document.createElement('div');
    firstRow.className = 'background-options-row';
    
    // Add "None" option as first tile in the grid
    const noneOption = this.createBackgroundOption(null, 'None', true);
    firstRow.appendChild(noneOption);
    
    // Add first 2 background images to complete the first row (after "None")
    for (let i = 0; i < 2 && i < this.availableBackgrounds.length; i++) {
      const bgPath = this.availableBackgrounds[i];
      const filename = bgPath.split('/').pop().replace('.png', '').replace('notext', '');
      const option = this.createBackgroundOption(bgPath, filename, false);
      firstRow.appendChild(option);
    }
    optionsContainer.appendChild(firstRow);
    
    // Add remaining background images in rows of 3
    for (let i = 2; i < this.availableBackgrounds.length; i += 3) {
      const row = document.createElement('div');
      row.className = 'background-options-row';
      
      for (let j = 0; j < 3 && (i + j) < this.availableBackgrounds.length; j++) {
        const bgPath = this.availableBackgrounds[i + j];
        const filename = bgPath.split('/').pop().replace('.png', '').replace('notext', '');
        const option = this.createBackgroundOption(bgPath, filename, false);
        row.appendChild(option);
      }
      
      optionsContainer.appendChild(row);
    }

    // Assemble modal
    content.appendChild(title);
    content.appendChild(optionsContainer);
    overlay.appendChild(content);

    // Add to document
    document.body.appendChild(overlay);
    this.modal = overlay;

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }

  /**
   * Create a background option element
   */
  createBackgroundOption(imagePath, label, isNone) {
    const option = document.createElement('div');
    option.className = 'background-option';
    
    // Check if this is the selected background
    const isSelected = (imagePath === null && this.selectedBackground === null) ||
                       (imagePath === this.selectedBackground);
    
    if (isSelected) {
      option.classList.add('selected');
    }

    if (isNone) {
      // Create icon for "None" option
      const icon = document.createElement('div');
      icon.className = 'background-none-icon';
      icon.innerHTML = '&#x2715;'; // × symbol
      option.appendChild(icon);
    } else {
      // Create image
      const img = document.createElement('img');
      img.src = `/${imagePath}`;
      img.alt = label;
      img.onerror = () => {
        img.style.display = 'none';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'background-error';
        errorDiv.textContent = 'Image not found';
        option.appendChild(errorDiv);
      };
      option.appendChild(img);
    }

    // Only show label for the "None" option
    if (isNone) {
      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      option.appendChild(labelEl);
    }

    // Add click handler
    option.addEventListener('click', () => {
      this.selectBackground(imagePath);
    });

    return option;
  }

  /**
   * Select a background
   */
  selectBackground(imagePath) {
    console.log('Background manager: Selecting background:', imagePath);
    this.selectedBackground = imagePath;
    console.log('Background manager: Selected background set to:', this.selectedBackground);
    
    // Update selected state in modal
    const options = this.modal.querySelectorAll('.background-option');
    options.forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Find and select the clicked option
    const selectedOption = Array.from(options).find(opt => {
      const img = opt.querySelector('img');
      return (imagePath === null && opt.querySelector('.background-none-icon')) ||
             (img && img.src.includes(imagePath));
    });
    
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    // Apply background immediately
    this.applyBackground();
    
    // Automatically close the modal after selection
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Apply background to deck editor (covers modal-content to include draw-hand-section)
   */
  applyBackground() {
    // Use specific selector for deck editor modal to avoid conflicts
    const deckEditorModal = document.getElementById('deckEditorModal');
    const modalContent = deckEditorModal ? deckEditorModal.querySelector('.modal-content') : null;
    const modalBody = deckEditorModal ? deckEditorModal.querySelector('.modal-body') : null;
    
    console.log('Background manager: Applying background:', this.selectedBackground);
    console.log('Background manager: Found modal-content:', modalContent);
    console.log('Background manager: Found modal-body:', modalBody);
    
    // Remove existing background from both modal-content and modal-body
    if (modalContent) {
      modalContent.style.backgroundImage = '';
      modalContent.style.backgroundColor = '';
    }
    if (modalBody) {
      modalBody.style.backgroundImage = '';
      modalBody.style.backgroundColor = '';
    }

    if (this.selectedBackground) {
      // Apply background image to modal-content so it covers draw-hand-section and modal-body
      // Header and stats bar have solid backgrounds so they won't show the image
      if (modalContent) {
        const imageUrl = `/${this.selectedBackground}`;
        console.log('Background manager: Setting background image on modal-content:', imageUrl);
        modalContent.style.backgroundImage = `url(${imageUrl})`;
        modalContent.style.backgroundSize = 'cover';
        modalContent.style.backgroundPosition = 'center';
        modalContent.style.backgroundRepeat = 'no-repeat';
        modalContent.style.backgroundAttachment = 'scroll'; // Changed from 'fixed' to 'scroll' for proper positioning
        modalContent.style.backgroundColor = 'transparent'; // Ensure no background color conflicts
      } else {
        console.warn('Background manager: modal-content not found, cannot apply background');
      }
    } else {
      // Default black background
      if (modalContent) {
        modalContent.style.backgroundColor = '#000000';
        modalContent.style.backgroundImage = '';
      }
    }
  }

  /**
   * Get selected background for saving
   */
  getSelectedBackground() {
    console.log('Background manager: getSelectedBackground() called, returning:', this.selectedBackground);
    return this.selectedBackground;
  }

  /**
   * Update selected background (called after deck save)
   */
  updateSelectedBackground(backgroundPath) {
    this.selectedBackground = backgroundPath;
    this.applyBackground();
  }
}

// Create global instance
window.deckBackgroundManager = new DeckBackgroundManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeckBackgroundManager;
}
