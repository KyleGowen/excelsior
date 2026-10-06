import { useContext } from 'react';
import { LayoutModeContext, type LayoutModeValue } from './layoutModeContext';
export function useLayoutMode():LayoutModeValue { const ctx=useContext(LayoutModeContext); if (!ctx) throw new Error('useLayoutMode must be used within a LayoutModeProvider'); return ctx; }
