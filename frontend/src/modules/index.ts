export { CardDatabaseModule } from '../features/database/CardDatabaseModule';
export { DeckBuilderModule, type DeckBuilderModuleProps } from '../features/deck-editor/DeckBuilderModule';
export { CollectionModule } from '../features/collection/CollectionModule';
export { ModuleHostProvider, type ModuleHost } from './ModuleHost';
export { createModuleApi, type ModuleApi } from './api';

export type { OverlayHostOptions } from '../lib/layout/OverlayHostProvider';
