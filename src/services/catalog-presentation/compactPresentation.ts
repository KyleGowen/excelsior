import type { CompactCatalogPresentationDto, SharedCatalogPresentation } from '../../api/dto/v1/CompactCatalogPresentationDto';
import type { PresentedCatalogCard } from './presentCatalog';

export function compactCatalogPresentation(cards: PresentedCatalogCard[]): CompactCatalogPresentationDto {
  const groups: SharedCatalogPresentation[] = [];
  const byContent = new Map<string, number>();
  return {
    format: 'catalog-presentation-compact-v1', schemaVersion: 1,
    catalogVersion: cards[0]?.presentation.catalogVersion ?? null,
    rulesVersion: 'catalog-presentation-compatibility-v1', groups,
    cards: cards.map(({ presentation, ...card }) => {
      const { schemaVersion: _schema, catalogVersion: _catalog, rulesVersion: _rules,
        logicalCardId, groupKey, addDefaultPrintingId, printingIds, characterNames, ...printing } = presentation;
      const shared = { logicalCardId, groupKey, addDefaultPrintingId, printingIds, characterNames };
      const key = JSON.stringify(shared);
      let group = byContent.get(key);
      if (group === undefined) { group = groups.length; groups.push(shared); byContent.set(key, group); }
      return { ...card, presentation: { ...printing, group } };
    }),
  };
}
