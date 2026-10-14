import type { CompactCatalogPresentationDto, SharedCatalogPresentation } from '../../contracts/CompactCatalogPresentationDto';
import type { CatalogCard } from './types';

const unavailable = () => new Error('Catalog presentation metadata is unavailable. Retry without using client rule fallbacks.');
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === 'string');

/** Restore existing domain metadata; this performs no card/game rule calculations. */
export function decodeCatalogPresentation(data: unknown): CatalogCard[] {
  if (!Array.isArray(data)) {
    if (!object(data) || data.format !== 'catalog-presentation-compact-v1' || data.schemaVersion !== 1
      || data.rulesVersion !== 'catalog-presentation-compatibility-v1' || !Array.isArray(data.cards)
      || (data.cards.length > 0 && typeof data.catalogVersion !== 'string')) throw unavailable();
    const compact = data as unknown as CompactCatalogPresentationDto;
    const groups: SharedCatalogPresentation[] = [];
    data = compact.cards.map(card => {
      if (!object(card) || typeof card.id !== 'string' || !card.id || !object(card.presentation)) throw unavailable();
      const { group, shared: definition, ...printing } = card.presentation;
      if (!Number.isInteger(group) || group < 0) throw unavailable();
      if (definition !== undefined) {
        if (group !== groups.length) throw unavailable();
        groups.push(definition);
      }
      const shared = groups[group];
      if (!object(shared) || typeof shared.logicalCardId !== 'string'
        || !(shared.groupKey === null || typeof shared.groupKey === 'string')
        || typeof shared.addDefaultPrintingId !== 'string' || !strings(shared.printingIds)
        || !strings(shared.characterNames)) throw unavailable();
      return { ...card, presentation: { ...printing, ...shared,
        printingIds: [...shared.printingIds], characterNames: [...shared.characterNames],
        printingId: card.id, schemaVersion: 1, catalogVersion: compact.catalogVersion!, rulesVersion: compact.rulesVersion,
      } };
    });
  }
  // Accept the full representation from older hosts that ignore compact=1.
  if (!Array.isArray(data) || data.some(card => !object(card) || !object(card.presentation)
    || card.presentation.schemaVersion !== 1 || !strings(card.presentation.characterNames)
    || !strings(card.presentation.printingIds))) throw unavailable();
  return data as CatalogCard[];
}
