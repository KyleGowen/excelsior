/** Host-owned guard for explicit navigation. No router, browser history or persistence. */
export interface ModuleDeckEditState { dirty: boolean; saving: boolean }
export interface ModuleEditingPort { register: (state: ModuleDeckEditState) => () => void }
export interface UnsavedNavigationSnapshot { dirty: number; saving: number; pending: boolean }
export function createUnsavedNavigation() {
 const entries = new Map<symbol, ModuleDeckEditState>();
 const listeners = new Set<() => void>();
 let action: (() => void) | null = null;
 let snapshot: UnsavedNavigationSnapshot = { dirty: 0, saving: 0, pending: false };
 const publish = () => {
  const states = [...entries.values()];
  const next = { dirty: states.filter(s => s.dirty).length, saving: states.filter(s => s.saving).length, pending: Boolean(action) };
  if (next.dirty === snapshot.dirty && next.saving === snapshot.saving && next.pending === snapshot.pending) return;
  snapshot = next; listeners.forEach(listener => listener());
 };
 const register = (state: ModuleDeckEditState) => {
  const key = Symbol('module editor'); entries.set(key, { ...state }); publish();
  return () => { if (entries.delete(key)) publish(); };
 };
 return {
  register,
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  request: (next: () => void) => { if (snapshot.dirty || snapshot.saving) { action = next; publish(); } else next(); },
  stay: () => { action = null; publish(); },
  discard: () => { if (!action || snapshot.saving) return false; const next = action; action = null; publish(); next(); return true; },
 };
}
