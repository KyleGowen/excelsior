import type { CompactCatalogPresentationDto } from '../../api/dto/v1/CompactCatalogPresentationDto';
import type { PresentedCatalogCard } from './presentCatalog';

export function compactCatalogPresentation(cards: PresentedCatalogCard[]): CompactCatalogPresentationDto {
  const byContent = new Map<string, number>();
  return {
    format: 'catalog-presentation-compact-v1', schemaVersion: 1,
    catalogVersion: cards[0]?.presentation.catalogVersion ?? null,
    rulesVersion: 'catalog-presentation-compatibility-v1',
    cards: cards.map(({ presentation, ...card }) => {
      const { schemaVersion: _schema, catalogVersion: _catalog, rulesVersion: _rules, printingId: _printingId,
        logicalCardId, groupKey, addDefaultPrintingId, printingIds, characterNames, ...printing } = presentation;
      const shared = { logicalCardId, groupKey, addDefaultPrintingId, printingIds, characterNames };
      const key = JSON.stringify(shared);
      let group = byContent.get(key);
      const first = group === undefined;
      if (first) { group = byContent.size; byContent.set(key, group!); }
      // Keeping definitions beside their first row preserves gzip's nearby
      // matches with raw card IDs/text; a distant header dictionary did not.
      return { ...card, presentation: { ...printing, group: group!, ...(first ? { shared } : {}) } };
    }),
  };
}
