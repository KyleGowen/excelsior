/**
 * Unit tests for special-case power card usability filtering.
 * - John Carter of Mars: treat Brute Force as 8 for power card usability
 * - Time Traveler: treat Intelligence as 8 for power card usability
 * Also validates Any-Power/Multi Power use the effective max stat.
 */

type Character = {
  name: string;
  energy: number;
  combat: number;
  brute_force: number;
  intelligence: number;
};

type PowerCard = {
  value: number;
  power_type: 'Energy' | 'Combat' | 'Brute Force' | 'Intelligence' | 'Any-Power' | 'Multi-Power' | 'Multi Power';
};

function canAnyDeckCharacterUseCard(deckCharacters: Character[], card: PowerCard): boolean {
  return deckCharacters.some((char) => {
    const nameLower = (char.name || '').toLowerCase();
    const effectiveEnergy = char.energy || 0;
    const effectiveCombat = char.combat || 0;
    const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
    const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);

    let characterStat = 0;
    switch (card.power_type) {
      case 'Energy':
        characterStat = effectiveEnergy;
        break;
      case 'Combat':
        characterStat = effectiveCombat;
        break;
      case 'Brute Force':
        characterStat = effectiveBrute;
        break;
      case 'Intelligence':
        characterStat = effectiveIntel;
        break;
      case 'Any-Power':
      case 'Multi-Power':
      case 'Multi Power':
        characterStat = Math.max(effectiveEnergy, effectiveCombat, effectiveBrute, effectiveIntel);
        break;
    }
    return characterStat >= card.value;
  });
}

describe('Power Card Filtering - Special Cases', () => {
  it("John Carter: treats Brute Force 8 as usable, 9 as unusable if base < 8", () => {
    const johnCarter: Character = {
      name: 'John Carter of Mars',
      energy: 2,
      combat: 3,
      brute_force: 4, // base below 8
      intelligence: 4,
    };

    const bf8: PowerCard = { value: 8, power_type: 'Brute Force' };
    const bf9: PowerCard = { value: 9, power_type: 'Brute Force' };

    expect(canAnyDeckCharacterUseCard([johnCarter], bf8)).toBe(true);
    expect(canAnyDeckCharacterUseCard([johnCarter], bf9)).toBe(false);
  });

  it('Time Traveler: treats Intelligence 8 as usable, 9 as unusable if base < 8', () => {
    const timeTraveler: Character = {
      name: 'Time Traveler',
      energy: 2,
      combat: 3,
      brute_force: 4,
      intelligence: 5, // base below 8
    };

    const int8: PowerCard = { value: 8, power_type: 'Intelligence' };
    const int9: PowerCard = { value: 9, power_type: 'Intelligence' };

    expect(canAnyDeckCharacterUseCard([timeTraveler], int8)).toBe(true);
    expect(canAnyDeckCharacterUseCard([timeTraveler], int9)).toBe(false);
  });

  it('Any-Power uses effective max including overrides (John Carter)', () => {
    const johnCarter: Character = {
      name: 'John Carter of Mars',
      energy: 2,
      combat: 3,
      brute_force: 4, // overridden to 8 for usability
      intelligence: 4,
    };

    const any7: PowerCard = { value: 7, power_type: 'Any-Power' };
    const any8: PowerCard = { value: 8, power_type: 'Any-Power' };
    const any9: PowerCard = { value: 9, power_type: 'Any-Power' };

    expect(canAnyDeckCharacterUseCard([johnCarter], any7)).toBe(true);
    expect(canAnyDeckCharacterUseCard([johnCarter], any8)).toBe(true);
    expect(canAnyDeckCharacterUseCard([johnCarter], any9)).toBe(false);
  });

  it('Multi Power uses effective max including overrides (Time Traveler)', () => {
    const timeTraveler: Character = {
      name: 'Time Traveler',
      energy: 2,
      combat: 3,
      brute_force: 4,
      intelligence: 5, // overridden to 8
    };

    const multi7: PowerCard = { value: 7, power_type: 'Multi Power' };
    const multi8: PowerCard = { value: 8, power_type: 'Multi Power' };
    const multi9: PowerCard = { value: 9, power_type: 'Multi Power' };

    expect(canAnyDeckCharacterUseCard([timeTraveler], multi7)).toBe(true);
    expect(canAnyDeckCharacterUseCard([timeTraveler], multi8)).toBe(true);
    expect(canAnyDeckCharacterUseCard([timeTraveler], multi9)).toBe(false);
  });
});


