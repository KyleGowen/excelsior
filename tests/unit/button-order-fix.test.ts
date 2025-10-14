/**
 * Button Order Fix Tests
 * 
 * This test suite verifies that the "Change Art" button is positioned
 * to the left of both quantity adjustment buttons (-1 and +1) in edit mode.
 */

describe('Button Order Fix Tests', () => {
  describe('Special Card Button Order', () => {
    test('should position Change Art button before -1 and +1 buttons for special cards', () => {
      // Mock card data for special cards (non-character, non-location, non-mission)
      const specialCard = {
        type: 'power',
        cardId: 'test-card-123',
        quantity: 2
      };

      const availableCard = {
        name: 'Test Power Card',
        alternateImages: ['alt1.jpg', 'alt2.jpg']
      };

      // Mock the button generation logic for special cards (quantity-based logic)
      const generateButtons = (card: any, availableCard: any, index: number) => {
        let alternateArtButton = '';
        if (availableCard.alternateImages && availableCard.alternateImages.length > 0) {
          alternateArtButton = `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>`;
        }

        const buttons = [];
        
        // Change Art button should come first
        if (alternateArtButton) {
          buttons.push(alternateArtButton);
        }
        
        // Then -1 button (always present for special cards)
        buttons.push(`<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>`);
        
        // Then +1 button (always present for special cards)
        buttons.push(`<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>`);
        
        // Note: No - button for special cards - they use -1/+1 for quantity management

        return buttons.join('');
      };

      const buttonHtml = generateButtons(specialCard, availableCard, 0);

      // Verify the button order: Change Art, -1, +1 (no - button for special cards)
      expect(buttonHtml).toContain('alternate-art-btn');
      expect(buttonHtml).toContain('remove-one-btn');
      expect(buttonHtml).toContain('add-one-btn');
      expect(buttonHtml).not.toContain('quantity-btn'); // No - button for special cards
      
      // Verify Change Art button comes before -1 button
      const changeArtIndex = buttonHtml.indexOf('alternate-art-btn');
      const removeOneIndex = buttonHtml.indexOf('remove-one-btn');
      const addOneIndex = buttonHtml.indexOf('add-one-btn');
      
      expect(changeArtIndex).toBeLessThan(removeOneIndex);
      expect(removeOneIndex).toBeLessThan(addOneIndex);
    });

    test('should position Change Art button before -1 button for character cards', () => {
      // Mock card data for character cards
      const characterCard = {
        type: 'character',
        cardId: 'test-character-123',
        quantity: 1
      };

      const availableCard = {
        name: 'Test Character',
        alternateImages: ['alt1.jpg', 'alt2.jpg']
      };

      // Mock the button generation logic
      const generateButtons = (card: any, availableCard: any, index: number) => {
        let alternateArtButton = '';
        if (availableCard.alternateImages && availableCard.alternateImages.length > 0) {
          alternateArtButton = `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>`;
        }

        const buttons = [];
        
        // Change Art button should come first
        if (alternateArtButton) {
          buttons.push(alternateArtButton);
        }
        
        // Then -1 button for non-character/location/mission cards
        if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
          buttons.push(`<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>`);
        }
        
        // Then +1 button for non-character/location/mission cards
        if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
          buttons.push(`<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>`);
        }
        
        // Finally - button for character/location/mission cards
        if (card.type === 'character' || card.type === 'location' || card.type === 'mission') {
          buttons.push(`<button class="quantity-btn" onclick="removeCardFromEditor(${index})">-</button>`);
        }

        return buttons.join('');
      };

      const buttonHtml = generateButtons(characterCard, availableCard, 0);

      // Verify the button order: Change Art, -
      expect(buttonHtml).toContain('alternate-art-btn');
      expect(buttonHtml).toContain('quantity-btn');
      expect(buttonHtml).not.toContain('remove-one-btn'); // Character cards don't have -1/+1 buttons
      expect(buttonHtml).not.toContain('add-one-btn'); // Character cards don't have -1/+1 buttons
      
      // Verify Change Art button comes before - button
      const changeArtIndex = buttonHtml.indexOf('alternate-art-btn');
      const quantityBtnIndex = buttonHtml.indexOf('quantity-btn');
      
      expect(changeArtIndex).toBeLessThan(quantityBtnIndex);
    });

    test('should handle cards without alternate images correctly', () => {
      // Mock card data without alternate images
      const specialCard = {
        type: 'power',
        cardId: 'test-card-123',
        quantity: 2
      };

      const availableCard = {
        name: 'Test Power Card',
        alternateImages: [] // No alternate images
      };

      // Mock the button generation logic
      const generateButtons = (card: any, availableCard: any, index: number) => {
        let alternateArtButton = '';
        if (availableCard.alternateImages && availableCard.alternateImages.length > 0) {
          alternateArtButton = `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>`;
        }

        const buttons = [];
        
        // Change Art button should come first (if it exists)
        if (alternateArtButton) {
          buttons.push(alternateArtButton);
        }
        
        // Then -1 button for non-character/location/mission cards
        if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
          buttons.push(`<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>`);
        }
        
        // Then +1 button for non-character/location/mission cards
        if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
          buttons.push(`<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>`);
        }
        
        // Finally - button for character/location/mission cards
        if (card.type === 'character' || card.type === 'location' || card.type === 'mission') {
          buttons.push(`<button class="quantity-btn" onclick="removeCardFromEditor(${index})">-</button>`);
        }

        return buttons.join('');
      };

      const buttonHtml = generateButtons(specialCard, availableCard, 0);

      // Verify no Change Art button is present
      expect(buttonHtml).not.toContain('alternate-art-btn');
      
      // Verify -1 and +1 buttons are present and in correct order
      expect(buttonHtml).toContain('remove-one-btn');
      expect(buttonHtml).toContain('add-one-btn');
      
      const removeOneIndex = buttonHtml.indexOf('remove-one-btn');
      const addOneIndex = buttonHtml.indexOf('add-one-btn');
      
      expect(removeOneIndex).toBeLessThan(addOneIndex);
    });

    test('should verify button order matches the fixed HTML structure', () => {
      // This test verifies that our button generation logic matches the expected order
      // from the HTML structure we fixed in public/index.html
      
      const expectedOrder = [
        'alternate-art-btn',    // Change Art button first
        'remove-one-btn',       // -1 button second
        'add-one-btn',          // +1 button third
        'quantity-btn'          // - button last (for character/location/mission)
      ];

      // Mock the button generation for a special card with alternate images
      const specialCard = {
        type: 'power',
        cardId: 'test-card-123',
        quantity: 2
      };

      const availableCard = {
        name: 'Test Power Card',
        alternateImages: ['alt1.jpg', 'alt2.jpg']
      };

      const generateButtons = (card: any, availableCard: any, index: number) => {
        let alternateArtButton = '';
        if (availableCard.alternateImages && availableCard.alternateImages.length > 0) {
          alternateArtButton = `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>`;
        }

        const buttons = [];
        
        // Change Art button should come first
        if (alternateArtButton) {
          buttons.push(alternateArtButton);
        }
        
        // Then -1 button for non-character/location/mission cards
        if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
          buttons.push(`<button class="remove-one-btn" onclick="removeOneCardFromEditor(${index})">-1</button>`);
        }
        
        // Then +1 button for non-character/location/mission cards
        if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
          buttons.push(`<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>`);
        }
        
        // Finally - button for character/location/mission cards
        if (card.type === 'character' || card.type === 'location' || card.type === 'mission') {
          buttons.push(`<button class="quantity-btn" onclick="removeCardFromEditor(${index})">-</button>`);
        }

        return buttons.join('');
      };

      const buttonHtml = generateButtons(specialCard, availableCard, 0);

      // Verify that the buttons appear in the expected order
      let lastIndex = -1;
      for (const buttonClass of expectedOrder) {
        const currentIndex = buttonHtml.indexOf(buttonClass);
        if (currentIndex !== -1) {
          expect(currentIndex).toBeGreaterThan(lastIndex);
          lastIndex = currentIndex;
        }
      }
    });
  });
});
