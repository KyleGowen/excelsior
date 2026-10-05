import { createContext } from 'react';
export interface LayoutModeValue {
 isMobile: boolean;
 isDesktop: boolean;
 preferDesktop: boolean;
 setPreferDesktop: (on: boolean) => void;
}
/** Shared value only: each host chooses viewport or container measurement. */
export const LayoutModeContext = createContext<LayoutModeValue | null>(null);
