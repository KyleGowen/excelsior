import type { ModuleApi } from './api';
export type SaveFixtureMode = 'api' | 'delayed' | 'rejected';
/** Fictional local host controls only; never exported from the reusable module entry. */
export function saveFixtureApi(baseApi: ModuleApi, mode: SaveFixtureMode): ModuleApi {
 return { ...baseApi,
  updateDeckMeta: async (...args) => {
   if (mode === 'rejected') throw new Error('Fictional host save failure');
   if (mode === 'delayed') await new Promise(resolve => setTimeout(resolve, 1500));
   return baseApi.updateDeckMeta(...args);
  },
  replaceDeckCards: async (...args) => {
   if (mode === 'rejected') throw new Error('Fictional host save failure');
   return baseApi.replaceDeckCards(...args);
  },
 };
}
