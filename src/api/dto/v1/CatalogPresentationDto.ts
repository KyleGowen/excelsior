/** Additive catalog domain metadata; existing row/printing IDs remain valid. */
export interface CatalogPresentationDto {
  schemaVersion: 1;
  catalogVersion: string;
  rulesVersion: 'catalog-presentation-compatibility-v1';
  logicalCardId: string;
  printingId: string;
  groupKey: string | null;
  isFoil: boolean;
  isAlternateArt: boolean;
  normalizedSet: string;
  defaultRank: number;
  addDefaultPrintingId: string;
  basePrintingId: string | null;
  foilPrintingId: string | null;
  /** Server-declared display projection for a mapped foil missing from the catalog rows. */
  missingFoilPrinting?: { printingId: string; setNumber: string } | null;
  /** Printing-picker row IDs preserving current mapped-foil and foil-only promo behavior. */
  printingIds: string[];
  searchText: string;
  searchAliases: string[];
  characterNames: string[];
}
