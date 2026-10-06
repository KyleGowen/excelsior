/** Retained selector assertions use the server's presentation contract as live consumers do. */
import type {CatalogCard,CatalogType} from '../../frontend/src/lib/api/types';
import {presentCatalog} from '../../src/services/catalog-presentation/presentCatalog';
import * as defaults from '../../frontend/src/lib/catalog/defaultCatalogCards';
import * as printings from '../../frontend/src/lib/catalog/cardPrintings';
import * as stacks from '../../frontend/src/lib/catalog/characterStacks';
import {isAlternateArtCard as classifyAlternate} from '../../src/services/catalog-presentation/defaultCatalogCards';
import type {FoilCardMapLookup} from '../../frontend/src/lib/catalog/foilCatalog';
export const isAlternateArtCard=classifyAlternate;
export {qtyInDeckForRepresentative,findLastInstanceIdForRepresentative} from '../../frontend/src/lib/catalog/defaultCatalogCards';
const present=(cards:CatalogCard[],type:CatalogType,lookup?:Pick<FoilCardMapLookup,'foilToBase'>,characters:CatalogCard[]=[])=>presentCatalog(cards,type,[...(lookup?.foilToBase ?? [])].map(([foilCardId,baseCardId])=>({foilCardId,baseCardId,cardType:type})),characters) as CatalogCard[];
export function dedupeToDefaultCatalogCards(cards:CatalogCard[],type:CatalogType,preferred?:string){return defaults.dedupeToDefaultCatalogCards(present(cards,type),type,preferred);}
export function prepareAddCardsCatalogList(cards:CatalogCard[],type:CatalogType,foilToBase:Map<string,string>,preferred?:string){return defaults.prepareAddCardsCatalogList(present(cards,type,{foilToBase}),type,foilToBase,preferred);}
export function resolveDefaultCardForDeckAdd(card:CatalogCard,type:CatalogType,cards:CatalogCard[],lookup?:Pick<FoilCardMapLookup,'foilToBase'|'baseToFoil'>){const rows=present(cards,type,lookup);return defaults.resolveDefaultCardForDeckAdd(rows.find(c=>c.id===card.id) ?? card,type,rows,lookup);}
export function collectPrintingsForCard(card:CatalogCard,type:CatalogType,cards:CatalogCard[],lookup:FoilCardMapLookup){const rows=present(cards,type,lookup);return printings.collectPrintingsForCard(rows.find(c=>c.id===card.id) ?? card,type,rows,lookup);}
export function hasMultiplePrintings(card:CatalogCard,type:CatalogType,cards:CatalogCard[],lookup:FoilCardMapLookup){return collectPrintingsForCard(card,type,cards,lookup).length>1;}
export {filterCharacterStacks,stackCardsInAddOrder,stackTotalCardCount} from '../../frontend/src/lib/catalog/characterStacks';
export function specialCardMatchesCharacter(card:CatalogCard,name:string){return stacks.specialCardMatchesCharacter(present([card],'special-cards',undefined,[{id:'fixture-character',name}])[0],name);}
export function buildCharacterStacks(input:Parameters<typeof stacks.buildCharacterStacks>[0]){return stacks.buildCharacterStacks({...input,characters:present(input.characters,'characters'),specials:present(input.specials,'special-cards',undefined,input.characters),advancedUniverse:present(input.advancedUniverse,'advanced-universe',undefined,input.characters)});}
