import { useAuth } from '../../app/AuthProvider';
import { useDeckExportInputController } from './useDeckExportInputController';
export { createStubDeckExportInput } from './useDeckExportInputController';
export type { UseDeckExportInputResult } from './useDeckExportInputController';
export function useDeckExportInput(deckId: string | null, isGuest: boolean, enabled: boolean) {
 return useDeckExportInputController(deckId, isGuest, enabled, useAuth().user);
}
