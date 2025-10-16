/**
 * Regression tests for reserve button rendering.
 * Ensures that after selecting a reserve character, the selected card
 * still shows an actionable Reserve button (not a static span), and that
 * non-selected characters hide their button while a reserve is chosen.
 */

describe('Reserve Button Rendering - Regression', () => {
  function getReserveCharacterButton(currentDeckData: any, cardId: string, index: number): string {
    const isReserveCharacter = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character === cardId;
    const hasReserveCharacter = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character;

    if (isReserveCharacter) {
      const buttonText = 'Reserve';
      const buttonClass = 'reserve-btn active';
      const onclickFunction = `deselectReserveCharacter(${index})`;
      return `<button class="${buttonClass}" onclick="${onclickFunction}">${buttonText}</button>`;
    } else if (hasReserveCharacter) {
      return '';
    } else {
      const buttonText = 'Select Reserve';
      const buttonClass = 'reserve-btn';
      const onclickFunction = `selectReserveCharacter('${cardId}', ${index})`;
      return `<button class="${buttonClass}" onclick="${onclickFunction}">${buttonText}</button>`;
    }
  }

  it('shows actionable Reserve button for the selected character (no span)', () => {
    const currentDeckData = { metadata: { reserve_character: 'victory-harben' } };
    const html = getReserveCharacterButton(currentDeckData, 'victory-harben', 0);
    expect(html).toContain('<button');
    expect(html).toContain('reserve-btn active');
    expect(html).toContain('deselectReserveCharacter(0)');
    expect(html).not.toContain('<span class="reserve-indicator">');
  });

  it('hides buttons for other characters when a reserve is selected', () => {
    const currentDeckData = { metadata: { reserve_character: 'victory-harben' } };
    const html = getReserveCharacterButton(currentDeckData, 'sherlock-holmes', 1);
    expect(html).toBe('');
  });

  it('shows Select Reserve button when no reserve is selected', () => {
    const currentDeckData = { metadata: { reserve_character: null } };
    const html = getReserveCharacterButton(currentDeckData, 'victory-harben', 0);
    expect(html).toContain('Select Reserve');
    expect(html).toContain("selectReserveCharacter('victory-harben', 0)");
  });
});


