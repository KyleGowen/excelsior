import { scopeNativeStyles } from './nativeStyles';
import { createElement, type CSSProperties, type ReactNode } from 'react';

/** Reviewed visual tokens only. Layout, motion and stacking remain host contracts. */
const themeTokens = [
 '--color-bg-base',
 '--color-bg-surface',
 '--color-bg-elevated',
 '--color-bg-panel',
 '--color-bg-input',
 '--color-bg-hover',
 '--color-bg-scrim',
 '--color-accent',
 '--color-accent-bright',
 '--color-accent-dim',
 '--color-accent-soft',
 '--color-accent-glow',
 '--color-text',
 '--color-text-muted',
 '--color-text-dim',
 '--color-text-on-accent',
 '--color-border',
 '--color-border-strong',
 '--color-border-accent',
 '--color-stat-energy',
 '--color-stat-combat',
 '--color-stat-brute-force',
 '--color-stat-intelligence',
 '--color-stat-total',
 '--color-success',
 '--color-warning',
 '--color-danger',
 '--color-ko',
 '--color-ko-soft',
 '--color-ko-border',
 '--color-info',
 '--color-legal',
 '--color-not-legal',
 '--color-rarity-common',
 '--color-rarity-uncommon',
 '--color-rarity-rare',
 '--color-rarity-ultra',
 '--font-sans',
 '--font-display',
 '--font-stat-value',
 '--font-size-xs',
 '--font-size-sm',
 '--font-size-base',
 '--font-size-md',
 '--font-size-lg',
 '--font-size-xl',
 '--font-size-2xl',
 '--font-size-3xl',
 '--font-size-4xl',
 '--font-weight-normal',
 '--font-weight-medium',
 '--font-weight-semibold',
 '--font-weight-bold',
 '--line-tight',
 '--line-normal',
 '--space-1',
 '--space-2',
 '--space-3',
 '--space-4',
 '--space-5',
 '--space-6',
 '--space-8',
 '--space-10',
 '--space-12',
 '--space-16',
 '--radius-sm',
 '--radius-md',
 '--radius-lg',
 '--radius-xl',
 '--radius-full',
 '--shadow-panel',
 '--shadow-card',
 '--shadow-glow',
 '--shadow-pop',
] as const;
export type ModuleThemeToken = typeof themeTokens[number];
export interface ModuleAppearanceOptions {
 /** Trusted host configuration; omitted tokens inherit the existing defaults. */
 tokens?: Partial<Record<ModuleThemeToken, string>>;
 /** Native form-control appearance. This does not enable an Excelsior site theme. */
 colorScheme?: 'light' | 'dark';
}
const allowed = new Set<string>(themeTokens);
function appearanceStyle(options: ModuleAppearanceOptions, native: boolean): CSSProperties {
 if (options.colorScheme !== undefined && options.colorScheme !== 'light' && options.colorScheme !== 'dark') throw new Error('Module colorScheme must be light or dark');
 if (options.tokens !== undefined && (typeof options.tokens !== 'object' || options.tokens === null || Array.isArray(options.tokens))) throw new Error('Module tokens must be a visual-token map');
 const variables: Record<string, string> = {};
 for (const [name, value] of Object.entries(options.tokens ?? {})) {
  if (!allowed.has(name)) throw new Error(`Unsupported module visual token: ${name}`);
  if (typeof value !== 'string' || !value.trim() || value.length > 512) throw new Error(`Module token requires a nonempty CSS value: ${name}`);
  variables[name] = native ? scopeNativeStyles(value) : value;
 }
 return { ...variables, minWidth: 0, minHeight: 'inherit', fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-normal)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg-base)', ...(options.colorScheme ? { colorScheme: options.colorScheme } : {}) };
}
/** Stable per-instance boundary: no document, storage or stylesheet writes. */
export function ModuleAppearanceBoundary({ options, children, native = false }: { options: ModuleAppearanceOptions; children: ReactNode; native?: boolean }) {
 return createElement('div', { className: 'module-appearance', style: appearanceStyle(options, native) }, children);
}
