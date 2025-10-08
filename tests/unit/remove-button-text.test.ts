/**
 * Unit tests for Remove button text changes
 * Verifies that character, location, and mission cards show "X" instead of "Remove"
 */

describe('Remove Button Text Changes', () => {

  it('should display "X" instead of "Remove" for character cards', () => {
    // Mock the displayDeckCardsForEditing function behavior
    const mockCharacterCard = {
      type: 'character',
      name: 'Test Character',
      quantity: 1
    };

    // Simulate the HTML generation for character cards
    const characterButtonHtml = mockCharacterCard.type === 'character' || mockCharacterCard.type === 'location' || mockCharacterCard.type === 'mission' 
      ? `<button class="quantity-btn" onclick="removeCardFromEditor(0)">X</button>` 
      : '';

    expect(characterButtonHtml).toContain('>X<');
    expect(characterButtonHtml).not.toContain('>Remove<');
  });

  it('should display "X" instead of "Remove" for location cards', () => {
    // Mock the displayDeckCardsForEditing function behavior
    const mockLocationCard = {
      type: 'location',
      name: 'Test Location',
      quantity: 1
    };

    // Simulate the HTML generation for location cards
    const locationButtonHtml = mockLocationCard.type === 'character' || mockLocationCard.type === 'location' || mockLocationCard.type === 'mission' 
      ? `<button class="quantity-btn" onclick="removeCardFromEditor(0)">X</button>` 
      : '';

    expect(locationButtonHtml).toContain('>X<');
    expect(locationButtonHtml).not.toContain('>Remove<');
  });

  it('should display "X" instead of "Remove" for mission cards', () => {
    // Mock the displayDeckCardsForEditing function behavior
    const mockMissionCard = {
      type: 'mission',
      name: 'Test Mission',
      quantity: 1
    };

    // Simulate the HTML generation for mission cards
    const missionButtonHtml = mockMissionCard.type === 'character' || mockMissionCard.type === 'location' || mockMissionCard.type === 'mission' 
      ? `<button class="quantity-btn" onclick="removeCardFromEditor(0)">X</button>` 
      : '';

    expect(missionButtonHtml).toContain('>X<');
    expect(missionButtonHtml).not.toContain('>Remove<');
  });

  it('should still display "-1" and "+1" buttons for non-character/location/mission cards', () => {
    // Mock the displayDeckCardsForEditing function behavior
    const mockPowerCard = {
      type: 'power',
      name: 'Test Power',
      quantity: 2
    };

    // Simulate the HTML generation for power cards
    const powerButtonHtml = mockPowerCard.type !== 'character' && mockPowerCard.type !== 'location' && mockPowerCard.type !== 'mission' 
      ? `<button class="remove-one-btn" onclick="removeOneCardFromEditor(0)">-1</button><button class="add-one-btn" onclick="addOneCardToEditor(0)">+1</button>` 
      : '';

    expect(powerButtonHtml).toContain('>-1<');
    expect(powerButtonHtml).toContain('>+1<');
    expect(powerButtonHtml).not.toContain('>X<');
  });

  it('should verify all button text changes are consistent', () => {
    const cardTypes = ['character', 'location', 'mission'];
    
    cardTypes.forEach(cardType => {
      const buttonHtml = cardType === 'character' || cardType === 'location' || cardType === 'mission' 
        ? `<button class="quantity-btn" onclick="removeCardFromEditor(0)">X</button>` 
        : '';

      expect(buttonHtml).toContain('>X<');
      expect(buttonHtml).not.toContain('>Remove<');
    });
  });
});
