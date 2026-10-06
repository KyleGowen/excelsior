import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {ModuleHostProvider,type ModuleHost} from '../../../frontend/src/modules/ModuleHost';
import {createModuleApi} from '../../../frontend/src/modules/api';
import {useCollectionController,type UseCollectionResult} from '../../../frontend/src/lib/collection/useCollectionController';
import {setGuestQuantity,getGuestCollection} from '../../../frontend/src/lib/collection/guestCollection';
import type {CollectionEvaluationDto} from '../../../frontend/src/contracts/CollectionEvaluationDto';
import type {CollectionView} from '../../../frontend/src/lib/api/collection';
import type {CatalogCard} from '../../../frontend/src/lib/api/types';
const previousFetch=globalThis.fetch;
const card={id:'m8-fictional-card',name:'Fictional local card',image_path:'fictional.webp'} as CatalogCard;
const evaluation=(n:number,storage:'device'|'account'='device'):CollectionEvaluationDto=>({totalOwned:n,uniqueCards:n?1:0,quantities:n?{'character:m8-fictional-card':n}:{},capabilities:{canSetQuantity:true,storage,minimumQuantity:0,maximumQuantity:99}});
const view=(n:number):CollectionView=>({cards:n?[{id:'row',collection_id:'fictional',card_id:card.id,card_type:'character',image_path:'fictional.webp',quantity:n,created_at:'fictional',updated_at:'fictional'}]:[],evaluation:evaluation(n,'account')});
const deferred=<T,>()=>{let resolve!:(value:T)=>void;let reject!:(error:Error)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
let root:ReturnType<typeof createRoot>,container:HTMLDivElement,client:QueryClient,host:ModuleHost,current:UseCollectionResult;
const settle=async()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
function Probe({guest}:{guest:boolean}){current=useCollectionController(guest);return <output>{current.totalOwned??'pending'}</output>;}
const mount=async(guest=true)=>{await act(async()=>root.render(<QueryClientProvider client={client}><ModuleHostProvider host={host}><Probe guest={guest}/></ModuleHostProvider></QueryClientProvider>));await settle();};
beforeEach(()=>{globalThis.fetch=jest.fn(async()=>{throw Error('Unexpected fetch');});(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});host={api:createModuleApi({fetcher:jest.fn(async()=>{throw Error('Unexpected request');})}),identity:{user:null,isGuest:true,isAdmin:false},onOpenDeck:jest.fn(),onBack:jest.fn(),onHome:jest.fn()};});
afterEach(async()=>{await act(async()=>root.unmount());client.clear();container.remove();localStorage.clear();if(previousFetch)globalThis.fetch=previousFetch;else delete (globalThis as {fetch?:typeof fetch}).fetch;});
it('ignores a superseded Guest response and retains local quantities through evaluation failure/retry',async()=>{
 const old=deferred<CollectionEvaluationDto>(),latest=deferred<CollectionEvaluationDto>();
 const run=jest.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise).mockRejectedValueOnce(Error('Offline')).mockResolvedValue(evaluation(3));host.api.evaluateGuestCollection=run;
 await mount();expect(current.totalOwned).toBeNull();
 await act(async()=>{setGuestQuantity({cardId:card.id,cardType:'character',imagePath:'fictional.webp',quantity:2});});await settle();
 await act(async()=>latest.resolve(evaluation(2)));await settle();expect(current.totalOwned).toBe(2);
 await act(async()=>old.resolve(evaluation(99)));await settle();expect(current.totalOwned).toBe(2);
 await act(async()=>{setGuestQuantity({cardId:card.id,cardType:'character',imagePath:'fictional.webp',quantity:3});});await settle();expect(current.isError).toBe(true);expect(current.totalOwned).toBeNull();expect(current.isLoading).toBe(false);expect(current.canSetQuantity).toBe(false);expect(getGuestCollection()[0]?.quantity).toBe(3);
 await act(async()=>current.retry());await settle();expect(current.totalOwned).toBe(3);expect(current.canSetQuantity).toBe(true);
});
it('serializes absolute saved writes and derives each new value from a fresh saved view',async()=>{
 const first=deferred<unknown>();host.api.fetchCollectionView=jest.fn().mockResolvedValueOnce(view(0)).mockResolvedValueOnce(view(2)).mockResolvedValueOnce(view(3));host.api.addCollectionCard=jest.fn().mockReturnValue(first.promise);host.api.setCollectionQuantity=jest.fn().mockResolvedValue({});await mount(false);
 let one!:Promise<void>,two!:Promise<void>;await act(async()=>{one=current.setQuantity(card,'character',2);two=current.setQuantity(card,'character',3);});await settle();expect(host.api.addCollectionCard).toHaveBeenCalledTimes(1);expect(host.api.setCollectionQuantity).not.toHaveBeenCalled();expect(current.totalOwned).toBeNull();
 await act(async()=>{first.resolve({});await Promise.all([one,two]);});await settle();expect(host.api.setCollectionQuantity).toHaveBeenCalledWith(expect.objectContaining({quantity:3}));expect(current.totalOwned).toBe(3);expect(current.quantityFor(card.id,'character')).toBe(3);
});
it('does not fabricate saved totals on read failure and supports explicit retry',async()=>{host.api.fetchCollectionView=jest.fn().mockRejectedValueOnce(Error('Offline')).mockResolvedValue(view(4));await mount(false);expect(current.totalOwned).toBeNull();expect(current.canSetQuantity).toBe(false);await act(async()=>current.retry());await settle();expect(current.totalOwned).toBe(4);});

it('retains the selected fixture adapter in routed basenames and rejects arbitrary transports',async()=>{
 const {routedHarnessAccess,harnessAccess}=await import('../../../frontend/src/modules/harnessAccess');
 expect(routedHarnessAccess('/prepared-host','/prepared-host/lrg/tools/cards').basename).toBe('/prepared-host/lrg');
 expect(routedHarnessAccess('/prepared-host','/prepared-host/excelsior/tools/collection').basename).toBe('/prepared-host/excelsior');
 expect(routedHarnessAccess('/prepared-host','/prepared-host/tools/cards').basename).toBe('/prepared-host');
 expect(()=>harnessAccess('?adapter=https://example.test')).toThrow('Select direct');
});

it('records only bounded public request metadata and cleans up aborted delay listeners',async()=>{
 const {createLocalRequestEvidence}=await import('../../../frontend/src/modules/localRequestEvidence');
 const response={status:200,clone:()=>({arrayBuffer:async()=>new Uint8Array([1,2]).buffer})} as Response;
 const fetcher=jest.fn().mockResolvedValue(response);const model=createLocalRequestEvidence(fetcher);
 await model.fetcher('/api/v1/guest/decks/guest_private_fixture',{method:'GET',headers:{Authorization:'Bearer private-test-value'}});
 expect(JSON.stringify(model.getSnapshot())).not.toMatch(/private_fixture|private-test-value|Authorization/);
 expect(model.getSnapshot().requests[0]).toMatchObject({operation:'GET /api/v1/guest/decks/[guest-fixture]',status:200,decodedBytes:2});
 model.setMode('slow-collection');const abort=new AbortController();const pending=model.fetcher('/api/v1/collections/evaluate',{signal:abort.signal});abort.abort();await expect(pending).rejects.toMatchObject({name:'AbortError'});expect(fetcher).toHaveBeenCalledTimes(1);
 model.setMode('offline-collection');await expect(model.fetcher('/api/v1/collections/me/view')).rejects.toThrow('Fictional');expect(fetcher).toHaveBeenCalledTimes(1);
 model.setMode('online');await model.fetcher('/api/v1/collections/me/view');expect(fetcher).toHaveBeenCalledTimes(2);
});

it('cancels a read started during persistence before fetching the authoritative post-write view',async()=>{
 const write=deferred<unknown>(),old=deferred<CollectionView>();host.api.fetchCollectionView=jest.fn().mockResolvedValueOnce(view(0)).mockReturnValueOnce(old.promise).mockResolvedValueOnce(view(2));host.api.addCollectionCard=jest.fn().mockReturnValue(write.promise);await mount(false);
 let changed!:Promise<void>;await act(async()=>{changed=current.setQuantity(card,'character',2);});await settle();
 const focus=client.fetchQuery({queryKey:['collection','view'],queryFn:({signal})=>host.api.fetchCollectionView(signal),staleTime:0}).catch(()=>null);await settle();
 await act(async()=>{write.resolve({});await changed;});await settle();expect(current.totalOwned).toBe(2);
 await act(async()=>{old.resolve(view(99));await focus;});await settle();expect(current.totalOwned).toBe(2);
});
it('withholds uncertain saved totals until an explicit retry gets a successful fresh snapshot',async()=>{
 const fresh=deferred<CollectionView>();host.api.fetchCollectionView=jest.fn().mockResolvedValueOnce(view(2)).mockReturnValueOnce(fresh.promise);host.api.setCollectionQuantity=jest.fn().mockRejectedValue(Error('Acknowledgement unavailable'));await mount(false);
 await act(async()=>{await expect(current.setQuantity(card,'character',3)).rejects.toThrow('Acknowledgement');});await settle();expect(current.totalOwned).toBeNull();expect(current.canSetQuantity).toBe(false);
 await act(async()=>current.retry());await settle();expect(current.totalOwned).toBeNull();await act(async()=>fresh.resolve(view(3)));await settle();expect(current.totalOwned).toBe(3);expect(current.canSetQuantity).toBe(true);
});
