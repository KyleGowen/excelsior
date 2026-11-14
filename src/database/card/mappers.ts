import type {
  CardRarity,
  Character,
  SpecialCard,
  PowerCard,
  Location,
  Battleground,
  Mission,
  Event,
  Aspect,
  AdvancedUniverse,
  Teamwork,
  AllyUniverse,
  TrainingCard,
  BasicUniverse,
} from '../../types';

type DbRow = Record<string, unknown>;

export function mapCharacterRow(row: DbRow): Character {
  return {
    id: row.id as string,
    name: row.name as string,
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
    energy: row.energy as number,
    combat: row.combat as number,
    brute_force: row.brute_force as number,
    intelligence: row.intelligence as number,
    threat_level: row.threat_level as number,
    special_abilities: row.special_abilities as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    reverse_image_path: (row.reverse_image_path as string | null) ?? null,
    is_foil: (row.is_foil as boolean) || false,
  };
}

export function mapSpecialCardRow(row: DbRow): SpecialCard {
  const icons = row.icons as string[] | undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    card_type: row.card_type as string,
    character: row.character_name as string,
    card_effect: row.card_effect as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
    ...(icons !== undefined && { icons }),
    value: (row.value as number) ?? null,
    is_cataclysm: (row.cataclysm as boolean) || false,
    is_assist: (row.assist as boolean) || false,
    is_ambush: (row.ambush as boolean) || false,
    one_per_deck: (row.one_per_deck as boolean) || false,
    icon_offensive_swords: (row.icon_offensive_swords as boolean) || false,
    icon_defensive_shield: (row.icon_defensive_shield as boolean) || false,
    icon_remainder_of_battle: (row.icon_remainder_of_battle as boolean) || false,
    icon_remainder_of_game: (row.icon_remainder_of_game as boolean) || false,
    icon_attached_paperclip: (row.icon_attached_paperclip as boolean) || false,
    icon_astral_plane: (row.icon_astral_plane as boolean) || false,
    icon_first_action_only: (row.icon_first_action_only as boolean) || false,
    banned: (row.banned as boolean) || false,
    is_foil: (row.is_foil as boolean) || false,
  };
}

export function mapPowerCardRow(row: DbRow): PowerCard {
  return {
    id: row.id as string,
    name: row.name as string,
    power_type: row.power_type as string,
    value: row.value as number,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
    set_name: (row.set_name as string) || 'Edgar Rice Burroughs and the World Legends',
    one_per_deck: (row.one_per_deck as boolean) || false,
    is_foil: (row.is_foil as boolean) || false,
  };
}

export function mapLocationRow(row: DbRow): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    threat_level: row.threat_level as number,
    special_ability: row.special_ability as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
  };
}

/** Location from getAll (includes set, set_number, rarity). Return type matches Location; extra fields omitted at use site if needed. */
export function mapLocationRowWithSet(row: DbRow): Location & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  return {
    ...mapLocationRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapBattlegroundRow(row: DbRow): Battleground {
  return {
    id: row.id as string,
    name: row.name as string,
    special_ability: row.special_ability as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
    is_foil: (row.is_foil as boolean) || false,
  };
}

export function mapMissionRow(row: DbRow): Mission {
  return {
    id: row.id as string,
    mission_set: row.mission_set as string,
    card_name: row.name as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    is_foil: (row.is_foil as boolean) || false,
  };
}

/** Mission from getAll (includes set, set_number, rarity, name). */
export function mapMissionRowWithSet(row: DbRow): Mission & { set?: string; set_number?: string | null; rarity?: CardRarity | null; name?: string } {
  return {
    ...mapMissionRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
    name: row.name as string,
  };
}

export function mapEventRow(row: DbRow): Event {
  return {
    id: row.id as string,
    name: row.name as string,
    mission_set: row.mission_set as string,
    game_effect: row.game_effect as string,
    flavor_text: row.flavor_text as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    one_per_deck: (row.one_per_deck as boolean) || false,
  };
}

/** Event from getAll (includes set, set_number, rarity). */
export function mapEventRowWithSet(row: DbRow): Event & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  return {
    ...mapEventRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapAspectRow(row: DbRow): Aspect {
  return {
    id: row.id as string,
    card_name: row.name as string,
    card_type: row.card_type as string,
    location: row.location as string,
    card_effect: row.card_effect as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    is_fortification: (row.fortifications as boolean) || false,
    is_one_per_deck: (row.one_per_deck as boolean) || false,
  };
}

/** Aspect from getAll (includes aspect_description, icons, value, set, set_number, rarity). */
export function mapAspectRowWithSet(row: DbRow): Aspect {
  const aspectDesc = row.aspect_description as string | undefined;
  const icons = row.icons as string[] | undefined;
  const value = (row.value as number | null) ?? null;
  return {
    ...mapAspectRow(row),
    ...(aspectDesc !== undefined && { aspect_description: aspectDesc }),
    ...(icons !== undefined && { icons }),
    ...(value !== undefined && { value }),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapAdvancedUniverseRow(row: DbRow): AdvancedUniverse {
  return {
    id: row.id as string,
    name: row.name as string,
    card_type: row.card_type as string,
    character: row.character as string,
    card_effect: row.card_effect as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    is_one_per_deck: (row.one_per_deck as boolean) || false,
    icon_offensive_swords: (row.icon_offensive_swords as boolean) || false,
    icon_defensive_shield: (row.icon_defensive_shield as boolean) || false,
    icon_remainder_of_battle: (row.icon_remainder_of_battle as boolean) || false,
    icon_remainder_of_game: (row.icon_remainder_of_game as boolean) || false,
    icon_astral_plane: (row.icon_astral_plane as boolean) || false,
    icon_first_action_only: (row.icon_first_action_only as boolean) || false,
    is_foil: (row.is_foil as boolean) || false,
  };
}

/** AdvancedUniverse from getAll (includes card_description, set, set_number, rarity). */
export function mapAdvancedUniverseRowWithSet(row: DbRow): AdvancedUniverse & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  const cardDesc = row.card_description as string | undefined;
  return {
    ...mapAdvancedUniverseRow(row),
    ...(cardDesc !== undefined && { card_description: cardDesc }),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapTeamworkRow(row: DbRow): Teamwork {
  return {
    id: row.id as string,
    name: row.name as string,
    card_type: row.card_type as string,
    to_use: row.to_use as string,
    acts_as: row.acts_as as string,
    followup_attack_types: row.followup_attack_types as string,
    first_attack_bonus: row.first_attack_bonus as string,
    second_attack_bonus: row.second_attack_bonus as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    one_per_deck: (row.one_per_deck as boolean) || false,
  };
}

/** Teamwork from getAll (includes set, set_number, rarity). */
export function mapTeamworkRowWithSet(row: DbRow): Teamwork & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  return {
    ...mapTeamworkRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapAllyUniverseRow(row: DbRow): AllyUniverse {
  return {
    id: row.id as string,
    card_name: row.name as string,
    card_type: row.card_type as string,
    stat_to_use: row.stat_to_use as string,
    stat_type_to_use: row.stat_type_to_use as string,
    attack_value: row.attack_value as string,
    attack_type: row.attack_type as string,
    card_text: row.card_text as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    one_per_deck: (row.one_per_deck as boolean) || false,
  };
}

/** AllyUniverse from getAll (includes set, set_number, rarity). */
export function mapAllyUniverseRowWithSet(row: DbRow): AllyUniverse & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  return {
    ...mapAllyUniverseRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapTrainingRow(row: DbRow): TrainingCard {
  return {
    id: row.id as string,
    card_name: row.name as string,
    type_1: row.type_1 as string,
    type_2: row.type_2 as string,
    value_to_use: row.value_to_use as string,
    bonus: row.bonus as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    one_per_deck: (row.one_per_deck as boolean) || false,
    is_foil: (row.is_foil as boolean) || false,
  };
}

/** TrainingCard from getAll (includes set, set_number, rarity). */
export function mapTrainingRowWithSet(row: DbRow): TrainingCard & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  return {
    ...mapTrainingRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}

export function mapBasicUniverseRow(row: DbRow): BasicUniverse {
  return {
    id: row.id as string,
    card_name: row.name as string,
    type: row.type as string,
    value_to_use: row.value_to_use as string,
    bonus: row.bonus as string,
    image: (row.image_path as string) ?? '',
    image_path: row.image_path as string,
    one_per_deck: (row.one_per_deck as boolean) || false,
  };
}

/** BasicUniverse from getAll (includes set, set_number, rarity). */
export function mapBasicUniverseRowWithSet(row: DbRow): BasicUniverse & { set?: string; set_number?: string | null; rarity?: CardRarity | null } {
  return {
    ...mapBasicUniverseRow(row),
    set: (row.set as string) || 'ERB',
    set_number: (row.set_number as string) ?? null,
    rarity: (row.rarity as CardRarity | null) ?? null,
  };
}
