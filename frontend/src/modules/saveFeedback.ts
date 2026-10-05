import type { ReactNode } from 'react';

export interface ModuleSaveFeedbackContext {
 status: 'saving' | 'saved' | 'error';
 /** Existing user-facing result; pending text is available only to opted-in hosts. */
 message: string;
 /** Edits made after the request snapshot remain unsaved. */
 newerEditsPending: boolean;
}
/** Trusted, pure presentation only. No record identifiers, API, identity or save callbacks. */
export interface ModuleSaveFeedback {
 render: (context: ModuleSaveFeedbackContext) => ReactNode;
}
/** Undefined preserves the existing result; null deliberately suppresses host presentation. */
export function renderModuleSaveFeedback(options: ModuleSaveFeedback | undefined, context: ModuleSaveFeedbackContext | null, fallback: ReactNode): ReactNode {
 if (!context || !options) return fallback;
 const node = options.render({ status: context.status, message: context.message, newerEditsPending: context.newerEditsPending });
 return node === undefined ? fallback : node;
}
