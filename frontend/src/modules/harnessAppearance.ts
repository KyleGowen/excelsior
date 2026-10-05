import type { ModuleAppearanceOptions } from './ModuleAppearanceBoundary';
export type HarnessAppearance = 'default' | 'paper' | 'contrast';
export const harnessAppearance: Record<HarnessAppearance, ModuleAppearanceOptions> = {
 default: {},
 paper: { colorScheme: 'light', tokens: {
  '--color-bg-base': '#f7f4ed', '--color-bg-surface': '#fffdf8', '--color-bg-elevated': '#eae4d7', '--color-bg-panel': '#fffdf8', '--color-bg-input': '#ffffff', '--color-bg-hover': '#eee8dc', '--color-bg-scrim': 'rgba(35, 40, 50, 0.25)',
  '--color-text': '#20252f', '--color-text-muted': '#4d5869', '--color-text-dim': '#5a6678', '--color-text-on-accent': '#ffffff',
  '--color-border': '#c1b8a7', '--color-border-strong': '#8e816c', '--color-border-accent': '#69532d',
  '--color-accent': '#72582c', '--color-accent-bright': '#69532d', '--color-accent-dim': '#5c4827', '--color-accent-soft': 'rgba(105, 83, 45, 0.12)', '--color-accent-glow': 'rgba(105, 83, 45, 0.2)',
  '--font-sans': 'Georgia, serif', '--font-display': 'Georgia, serif', '--font-size-base': '16px', '--space-4': '20px', '--radius-md': '4px', '--radius-lg': '6px', '--shadow-panel': '0 6px 20px rgba(35, 40, 50, 0.15)',
  '--color-legal': '#17653d', '--color-not-legal': '#a12535', '--color-success': '#17653d', '--color-danger': '#a12535', '--color-warning': '#8a5b0a',
 } },
 contrast: { colorScheme: 'dark', tokens: {
  '--color-bg-base': '#111111', '--color-bg-surface': '#191919', '--color-bg-elevated': '#292929', '--color-bg-panel': '#191919', '--color-bg-input': '#111111', '--color-bg-hover': '#303030',
  '--color-text': '#ffffff', '--color-text-muted': '#cfcfcf', '--color-text-dim': '#aaaaaa', '--color-text-on-accent': '#111111',
  '--color-border': '#777777', '--color-border-strong': '#aaaaaa', '--color-border-accent': '#ffe169',
  '--color-accent': '#ffe169', '--color-accent-bright': '#ffe169', '--color-accent-dim': '#d1b644', '--color-accent-soft': 'rgba(255, 225, 105, 0.15)', '--color-accent-glow': 'rgba(255, 225, 105, 0.25)',
  '--font-sans': 'Arial, sans-serif', '--font-display': 'Arial, sans-serif', '--font-size-base': '18px', '--space-4': '24px', '--radius-md': '2px', '--radius-lg': '2px',
 } },
};
