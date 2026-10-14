import type { CatalogType } from '../../lib/api/types';

/** Location/Battleground/event thumbs bake contain letterbox incompatible with cover framing. */
export function deckEditorUsesThumbnail(catalogType?: CatalogType): boolean {
  return catalogType !== 'locations' && catalogType !== 'battlegrounds' && catalogType !== 'events';
}

/** Grid art loads near the viewport; an opened Draw Hand opts into eager loading. */
export function deckEditorCardImageLoadingProps(
  catalogType?: CatalogType,
  loading: 'lazy' | 'eager' = 'lazy',
): {
  useThumbnail: boolean;
  progressive: boolean;
  progressiveSessionScope: 'deck-editor';
  loading: 'lazy' | 'eager';
  className: string;
} {
  const useThumbnail = deckEditorUsesThumbnail(catalogType);
  return {
    useThumbnail,
    progressive: useThumbnail,
    progressiveSessionScope: 'deck-editor',
    loading,
    className: 'card-image--contain',
  };
}
