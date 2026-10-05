export { CardDatabaseModule } from '../features/database/CardDatabaseModule';
export { DeckBuilderModule, type DeckBuilderModuleProps } from '../features/deck-editor/DeckBuilderModule';
export { CollectionModule } from '../features/collection/CollectionModule';
export { ModuleHostProvider, type ModuleHost } from './ModuleHost';
export { createModuleApi, type ModuleApi } from './api';

export type { OverlayHostOptions } from '../lib/layout/OverlayHostProvider';

export type { ContainerLayoutOptions } from '../lib/layout/ContainerLayoutModeProvider';

export type { ModuleAppearanceOptions, ModuleThemeToken } from './ModuleAppearanceBoundary';

export type { ModuleCardActions, ModuleCardActionContext, ModuleAuthenticationRequest, ModuleCardSource } from './cardActions';

export type { ModuleIconOptions, UIIconName, UIIconContext } from '../lib/icons/uiIconOverrides';

export type { ModuleSaveFeedback, ModuleSaveFeedbackContext } from './saveFeedback';
