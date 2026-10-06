import { moduleAssets } from '../../modules/assetRegistry';
/** Canonical power-type and threat icon keys for PNG badges. */
export type StatIconType =
  | 'energy'
  | 'combat'
  | 'brute_force'
  | 'intelligence'
  | 'threat_level';

export const STAT_ICON_PATHS: Record<string, string> = {
  energy: moduleAssets['energy'],
  combat: moduleAssets['combat'],
  brute_force: moduleAssets['brute_force'],
  intelligence: moduleAssets['intelligence'],
  threat_level: moduleAssets['threat'],
  Energy: moduleAssets['energy'],
  Combat: moduleAssets['combat'],
  'Brute Force': moduleAssets['brute_force'],
  Intelligence: moduleAssets['intelligence'],
  'Any-Power': moduleAssets['any-power'],
};

export const STAT_ICON_LABELS: Record<StatIconType, string> = {
  energy: 'Energy',
  combat: 'Combat',
  brute_force: 'Brute Force',
  intelligence: 'Intelligence',
  threat_level: 'Threat',
};

export function buildStatIconBadgeLabel(type: StatIconType, value: number | string): string {
  return `${STAT_ICON_LABELS[type]}: ${String(value)}`;
}
