import { createContext, type ReactNode } from 'react';

/** Decorative application controls only; game stat/card art and Google identity are separate assets. */
export type UIIconName = 'home' | 'database' | 'decks' | 'collection' | 'profile' | 'search' | 'filter' | 'sliders' | 'grid' | 'list' | 'plus' | 'minus' | 'close' | 'chevron-down' | 'chevron-up' | 'grip-vertical' | 'chevron-right' | 'chevron-left' | 'chevrons-left' | 'chevrons-right' | 'eye' | 'eye-off' | 'star' | 'bookmark' | 'more-horizontal' | 'pin' | 'heart' | 'lock' | 'trophy' | 'users' | 'analytics' | 'sparkles' | 'build' | 'logout' | 'save' | 'play' | 'share' | 'copy' | 'export' | 'import' | 'settings' | 'dots' | 'check' | 'help' | 'alert-triangle' | 'mail' | 'external-link' | 'send' | 'edit' | 'trash' | 'cards' | 'book' | 'chart-bar';
export interface UIIconContext {
 name: UIIconName;
 className?: string;
 filled: boolean;
}
export interface ModuleIconOptions {
 /** Pure trusted renderer. undefined retains the original icon; null deliberately hides it. */
 render: (context: UIIconContext) => ReactNode;
}
/** Internal context: a ModuleHostProvider supplies it per instance, including React portals. */
export const UIIconOverridesContext = createContext<ModuleIconOptions | null>(null);
