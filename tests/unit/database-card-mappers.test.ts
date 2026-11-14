import {
  mapAdvancedUniverseRow,
  mapCharacterRow,
  mapSpecialCardRow,
} from '../../src/database/card/mappers';

describe('mapCharacterRow', () => {
  it('exposes an optional reverse image path for two-faced characters', () => {
    const mapped = mapCharacterRow({
      id: 'walkers',
      name: 'Walkers: Herd',
      set: 'SKY',
      set_number: '226',
      energy: 1,
      combat: 3,
      brute_force: 8,
      intelligence: 1,
      threat_level: 19,
      special_abilities: 'Flip when KO’d.',
      image_path: 'sky/characters/226_walkers_herd.png',
      reverse_image_path: 'sky/characters/226_walkers.png',
      is_foil: false,
    });

    expect(mapped.reverse_image_path).toBe('sky/characters/226_walkers.png');
  });
});

describe('mapSpecialCardRow', () => {
  it('maps function icon booleans with defaults', () => {
    const mapped = mapSpecialCardRow({
      id: 'special-1',
      name: 'Test Special',
      card_type: 'special',
      character_name: 'Test Character',
      card_effect: 'Test effect',
      image_path: 'specials/test_special.webp',
      set: 'ERB',
      set_number: '001',
      cataclysm: false,
      assist: false,
      ambush: false,
      one_per_deck: true,
      icon_offensive_swords: true,
      icon_remainder_of_battle: true,
    });

    expect(mapped.icon_offensive_swords).toBe(true);
    expect(mapped.icon_remainder_of_battle).toBe(true);
    expect(mapped.icon_defensive_shield).toBe(false);
    expect(mapped.icon_remainder_of_game).toBe(false);
    expect(mapped.icon_attached_paperclip).toBe(false);
    expect(mapped.icon_astral_plane).toBe(false);
    expect(mapped.icon_first_action_only).toBe(false);
  });
});

describe('mapAdvancedUniverseRow', () => {
  it('maps function icon booleans with defaults', () => {
    const mapped = mapAdvancedUniverseRow({
      id: 'advanced_universe_shards_of_the_staff',
      name: 'Shards of the Staff',
      card_type: 'advanced_universe',
      character: 'Ra',
      card_effect: 'Test effect',
      image_path: 'advanced-universe/shards_of_the_staff.webp',
      one_per_deck: true,
      icon_offensive_swords: true,
      icon_defensive_shield: true,
      icon_remainder_of_game: true,
      icon_first_action_only: true,
      is_foil: true,
    });

    expect(mapped.icon_offensive_swords).toBe(true);
    expect(mapped.icon_defensive_shield).toBe(true);
    expect(mapped.icon_remainder_of_game).toBe(true);
    expect(mapped.icon_remainder_of_battle).toBe(false);
    expect(mapped.icon_astral_plane).toBe(false);
    expect(mapped.icon_first_action_only).toBe(true);
    expect(mapped.is_foil).toBe(true);
  });
});
