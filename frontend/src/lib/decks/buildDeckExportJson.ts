import type { ExportDeckJsonFull } from '../../contracts/DeckExportDto';
export type { ExportDeckCardsJson, ExportDeckJsonFull } from '../../contracts/DeckExportDto';
export interface BuildDeckExportJsonInput { deck:ExportDeckJsonFull | null; }
export function buildDeckExportJson(input:BuildDeckExportJsonInput):ExportDeckJsonFull | null { return input.deck; }
