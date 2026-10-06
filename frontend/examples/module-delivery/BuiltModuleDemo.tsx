import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CardDatabaseModule, CollectionModule, DeckBuilderModule, ModuleHostProvider, createModuleApi, moduleAssets, type ModuleImageAssets } from '../../dist/modules/index.js';
import type { AppUser } from '../../dist/modules/types/lib/api/types';
/** This host imports only the built artifact, React and Query; no application source/helpers. */
export function BuiltModuleDemo({user=null,initialDeckId='b4ec3a04-ab17-4a33-b813-df35f8195d75'}:{user?:AppUser|null;initialDeckId?:string}) {
 const [client] = useState(() => new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}}));
 const api = useMemo(() => createModuleApi(),[]);
 const [route,setRoute] = useState('cards');
 const [second,setSecond] = useState(false);
 const [width,setWidth] = useState('1120');
 const [deckId,setDeckId] = useState(initialDeckId);
 const [receipt,setReceipt] = useState('Ready');
 const [reverse,setReverse] = useState(false);
 const [missing,setMissing] = useState(false);
 const missingArt='/src/resources/cards/images/fictional-m8-missing.webp';
 const assets = useMemo<ModuleImageAssets>(() => {
  // Deliberate Excelsior local host adapter. The module knows none of these paths.
  const art = (raw:string|null|undefined,type?:string) => !raw ? moduleAssets.placeholder : /^(https?:|data:|blob:)/i.test(raw) ? raw : '/'+raw.replace(/^\/+/, '').replace(/^src\/resources\//,'src/resources/').replace(/^(?!src\/resources\/)/,`src/resources/cards/images/${type === 'locations' && !raw.includes('/') ? 'locations/' : ''}`);
  return {resolveImageUrl:art,resolveThumbUrl:art,placeholderImageUrl:() => moduleAssets.placeholder,assetUrl:url => url};
 },[]);
 const host = {api,assets,identity:{user,isGuest:!user || user.role === 'GUEST',isAdmin:user?.role === 'ADMIN'},onOpenDeck:(id:string) => {setDeckId(id);setRoute('deck');setReceipt('Deck opened through host callback');},onBack:() => setRoute('cards'),onHome:() => setRoute('cards'),styles:{mode:'isolated' as const,height:680},appearance:{tokens:{'--font-sans':'Poppins, sans-serif'}},features:{addCards:false}};
 return <QueryClientProvider client={client}><header><h1>Built module delivery proof</h1><p>Fictional host · private same-repository preparation</p><nav aria-label="Delivery host navigation"><button onClick={() => setRoute('cards')}>Card Database</button><button onClick={() => setRoute('deck')}>Deck Builder</button><button onClick={() => setRoute('collection')}>Collection</button></nav><label>Consumer surface width <select aria-label="Consumer surface width" value={width} onChange={e => setWidth(e.target.value)}><option>390</option><option>720</option><option>1120</option></select></label><label><input type="checkbox" checked={second} onChange={e => setSecond(e.target.checked)} />Second built module</label><label><input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} />Alternate asset contract</label><label><input type="checkbox" checked={missing} onChange={e => setMissing(e.target.checked)} />Missing first-module art</label><output aria-label="Host callback receipt">{receipt}</output></header><main style={{width:Number(width),maxWidth:'100%'}}><section aria-label="Built module"><ModuleHostProvider host={{...host,assets:missing ? {...assets,resolveImageUrl:() => missingArt,resolveThumbUrl:() => missingArt} : reverse ? {...assets,resolveImageUrl:() => moduleAssets.placeholder,resolveThumbUrl:() => moduleAssets.placeholder} : assets}}>{route==='deck' ? <DeckBuilderModule deckId={deckId} readonly /> : route==='collection' ? <CollectionModule /> : <CardDatabaseModule />}</ModuleHostProvider></section>{second && <section aria-label="Second built module"><ModuleHostProvider host={{...host,assets,appearance:{tokens:{'--font-sans':'Georgia, serif'}}}}><CardDatabaseModule /></ModuleHostProvider></section>}</main></QueryClientProvider>;
}
