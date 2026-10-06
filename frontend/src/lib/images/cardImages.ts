import type { CatalogCard, CatalogType } from '../api/types';
import { moduleAssets } from '../../modules/assetRegistry';
export interface ModuleImageAssets {
 resolveImageUrl:(raw:string|null|undefined,catalogType?:CatalogType) => string;
 resolveThumbUrl:(raw:string|null|undefined,catalogType?:CatalogType) => string;
 placeholderImageUrl:() => string;
 assetUrl:(url:string) => string;
 reverseImagePathForImagePath?:(raw:string|null|undefined) => string|null;
}
/** Declared browser-only default: catalog URLs must be absolute; relative art requires a host resolver. */
function absolute(raw:string|null|undefined):string {
 if (!raw) return moduleAssets.placeholder;
 if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
 throw new Error('Relative card art requires ModuleHost.assets URL resolvers');
}
export const defaultImageAssets:ModuleImageAssets = {resolveImageUrl:absolute,resolveThumbUrl:absolute,placeholderImageUrl:() => moduleAssets.placeholder,assetUrl:url => url};
export function imagePathFromCard(card:Partial<CatalogCard>|null|undefined):string { return (card?.image_path as string) || (card?.image as string) || ''; }
export function canProgressiveLoad(raw:string|null|undefined):boolean { return Boolean(raw && !/^(https?:|data:|blob:)/i.test(raw) && !raw.includes('/thumb/')); }
export function imageElementMatchesUrl(img:HTMLImageElement,url:string):boolean {
 if (!url || !img.src) return false;
 if (img.src === url) return true;
 try { return new URL(img.src,'http://localhost').pathname === new URL(url,'http://localhost').pathname; } catch { return img.src.endsWith(url); }
}
