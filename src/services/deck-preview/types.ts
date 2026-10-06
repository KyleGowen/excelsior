export type { CatalogCard, CatalogType } from '../catalog-presentation/types';
export type UserRole = 'GUEST' | 'USER' | 'ADMIN';
export interface DeckCardEntry { id?: string; type: 'character'|'special'|'power'|'location'|'battleground'|'mission'|'event'|'aspect'|'advanced-universe'|'teamwork'|'ally-universe'|'training'|'basic-universe'; cardId: string; quantity: number; instanceId?: string; exclude_from_draw?: boolean; name?: string; }
