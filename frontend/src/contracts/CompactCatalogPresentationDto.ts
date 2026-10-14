import type { CatalogPresentationDto } from './CatalogPresentationDto';

export type SharedCatalogPresentation = Pick<CatalogPresentationDto,
  'logicalCardId' | 'groupKey' | 'addDefaultPrintingId' | 'printingIds' | 'characterNames'>;
export type CompactCardPresentation = Omit<CatalogPresentationDto,
  keyof SharedCatalogPresentation | 'schemaVersion' | 'catalogVersion' | 'rulesVersion' | 'printingId'> & {
    group: number;
    /** Defined with the first card in a group; later references point backward. */
    shared?: SharedCatalogPresentation;
  };

/** Opt-in wire format. Expands losslessly to the existing per-card contract. */
export interface CompactCatalogPresentationDto {
  format: 'catalog-presentation-compact-v1';
  schemaVersion: 1;
  catalogVersion: string | null;
  rulesVersion: CatalogPresentationDto['rulesVersion'];
  cards: Array<Record<string, unknown> & { id: string; presentation: CompactCardPresentation }>;
}
