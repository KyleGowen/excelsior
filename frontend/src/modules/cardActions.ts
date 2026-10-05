import type { ReactNode } from 'react';
import type { CatalogCard, CatalogType } from '../lib/api/types';

export type ModuleCardSource = 'database' | 'collection' | 'deck';
export interface ModuleCardActionContext {
 source: ModuleCardSource;
 card: CatalogCard;
 catalogType: CatalogType;
 isGuest: boolean;
 deck?: { id: string; readOnly: boolean };
 close: () => void;
 requestAuthentication?: () => void;
}
export interface ModuleAuthenticationRequest {
 source: ModuleCardSource;
 cardId: string;
 catalogType: CatalogType;
 deckId?: string;
}
/** Trusted host presentation. It receives no transport, credentials or mutation helpers. */
export interface ModuleCardActions {
 render: (context: ModuleCardActionContext) => ReactNode;
 requestAuthentication?: (request: ModuleAuthenticationRequest) => void;
}
/** Omission preserves existing actions; a configured renderer returning null deliberately hides them. */
export function renderModuleCardActions(options: ModuleCardActions | undefined, context: Omit<ModuleCardActionContext, 'requestAuthentication'>, fallback?: ReactNode): ReactNode {
 if (!options) return fallback;
 const request = { source: context.source, cardId: context.card.id, catalogType: context.catalogType, ...(context.deck ? { deckId: context.deck.id } : {}) };
 return options.render({ ...context, ...(options.requestAuthentication ? { requestAuthentication: () => options.requestAuthentication?.(request) } : {}) });
}
