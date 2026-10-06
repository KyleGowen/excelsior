/** Adapts existing fictional characterization inputs to the authoritative server core. */
import { candidateContext } from '../../src/services/deck-candidates/context';
import { buildImportCatalogMap } from '../../src/services/deck-preview/resolveImportCardIds';
import type { CatalogCard, CatalogType } from '../../src/services/catalog-presentation/types';
export * from '../../src/services/deck-candidates/deckUsabilityUtils';
export * from '../../src/services/deck-candidates/isCatalogCardUsable';
export * from '../../src/services/deck-candidates/types';
export const deckCatalogIndexKey = (type:string,id:string) => `${type}:${id}`;
export function buildDeckUsabilityContext(cards:Array<{type:string;cardId:string;quantity:number}>,catalogs:Partial<Record<CatalogType,CatalogCard[]>>,options?:{deckCatalogIndex?:Map<string,CatalogCard>}) {
 const catalog=buildImportCatalogMap(catalogs);
 for(const [key,c] of options?.deckCatalogIndex ?? []) {
  const split=key.indexOf(':');
  catalog.set(`${key.slice(0,split).replace(/-/g,'_')}_${key.slice(split+1)}`,c);
 }
 return candidateContext(cards,catalog);
}
export { effectiveHideUnusablesForTab, catalogTypeSupportsHideUnusables } from '../../frontend/src/lib/deck-usability';
