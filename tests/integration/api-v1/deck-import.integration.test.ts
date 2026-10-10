import request from 'supertest';
import {app} from '../../../src/test-server';
import {DataSourceConfig} from '../../../src/config/DataSourceConfig';
import {integrationTestUtils} from '../../setup-integration';
import {createImportedDeck} from '../../../src/database/deck/deck-crud';
import {createDeckRepositoryContext} from '../../../src/database/deck/context';
import {readFileSync} from 'fs';
import {join} from 'path';
describe('Atomic import real HTTP and persistence',()=>{
 it('imports the full Modern TopDeck sample and reimports its JSON export including universe attachments',async()=>{
  const password='Fictional-horror-import-123';const user=await integrationTestUtils.createTestUser({name:'TopDeckHorrorFixture',email:'topdeck-horror@example.invalid',password});
  const agent=request.agent(app);await agent.post('/api/auth/login').send({username:user.username,password}).expect(200);
  const sample=readFileSync(join(__dirname,'../../fixtures/topdeck/modern-horror.txt'),'utf8');
  const first=await agent.post('/api/v1/decks/import').send({name:'Modern text fixture',exportData:sample}).expect(201);integrationTestUtils.trackTestDeck(first.body.data.deckId);
  const full=(await agent.get(`/api/v1/decks/${first.body.data.deckId}/full`).expect(200)).body.data;
  expect(first.body.data.cardsAdded).toBe(76);expect(full.cards.filter((c:any)=>c.type==='basic-universe'&&c.exclude_from_draw)).toHaveLength(3);expect(full.cards.filter((c:any)=>c.type==='aspect')).toHaveLength(1);
  expect(full.evaluation.counts.drawPile).toBe(61);expect(full.evaluation.legality.rawValid).toBe(true);
  const draft={schemaVersion:1,draftId:first.body.data.deckId,revision:0,cards:full.cards.map((c:any)=>({type:c.type,cardId:c.cardId,quantity:c.quantity,exclude_from_draw:c.exclude_from_draw})),reserveCharacterId:full.metadata.reserve_character,limited:false,format:'venture',koCharacterIds:[]};
  const exported=(await agent.post('/api/v1/decks/export').send({draft,display:{name:'Modern fixture',description:'',exportedBy:'Fictional',surface:'selection'}}).expect(200)).body.data;
  expect(exported.topDeck).toContain('Cards: 64/56 | Threat: 76/76');expect(exported.topDeck).toContain('→ Trident [ERB] (on location)');
  expect(exported.deck.cards.basic_universe).toEqual(expect.arrayContaining(['Ray Gun - Energy 6 or greater +2','Trident - Brute Force 6 or greater +3',"Merlin's Wand - Energy 6 or greater +3"]));
  const second=await agent.post('/api/v1/decks/import').send({name:'Modern JSON fixture',exportData:exported.deck}).expect(201);integrationTestUtils.trackTestDeck(second.body.data.deckId);
  const roundTrip=(await agent.get(`/api/v1/decks/${second.body.data.deckId}/full`).expect(200)).body.data;
  expect(second.body.data.cardsAdded).toBe(76);expect(roundTrip.cards.filter((c:any)=>c.type==='basic-universe')).toHaveLength(3);expect(roundTrip.cards.filter((c:any)=>c.type==='aspect')).toHaveLength(1);
  const pool=DataSourceConfig.getInstance().getPool();
  expect((await pool.query('SELECT name FROM characters WHERE id=$1',[roundTrip.metadata.reserve_character])).rows[0].name).toBe('Anubis');
 });
 it('persists all cards and metadata once, and leaves no unresolved partial deck',async()=>{
  const password='Fictional-import-only-123';const user=await integrationTestUtils.createTestUser({name:'M7ImportOwner',email:'m7-import@example.invalid',password});
  const agent=request.agent(app);await agent.post('/api/auth/login').send({username:user.username,password}).expect(200);
  const pool=DataSourceConfig.getInstance().getPool();
  const name='M7 fictional atomic import';
  const input={name,exportData:{limited:true,reserve_character:'Lancelot',cards:{characters:['Lancelot'],power_cards:['5 - Combat','5 - Combat']}}};
  const imported=await agent.post('/api/v1/decks/import').send(input).expect(201);const id=imported.body.data.deckId;integrationTestUtils.trackTestDeck(id);
  expect(imported.body.data).toMatchObject({ok:true,userId:user.id,cardsAdded:3});
  const full=await agent.get(`/api/v1/decks/${id}/full`).expect(200);expect(full.body.data.cards).toHaveLength(2);expect(full.body.data.metadata.is_limited).toBe(true);expect(full.body.data.metadata.reserve_character).toBeTruthy();expect(full.body.data.evaluation.counts.physicalPlayable).toBe(2);
  const draft={schemaVersion:1,draftId:id,revision:0,cards:full.body.data.cards.map((c:any)=>({type:c.type,cardId:c.cardId,quantity:c.quantity})),reserveCharacterId:full.body.data.metadata.reserve_character,limited:true,format:'venture',koCharacterIds:[]};
  const exported=await agent.post('/api/v1/decks/export').send({draft,display:{name,description:'',exportedBy:'Fictional',surface:'selection'}}).expect(200);
  expect(exported.body.data.topDeck).toContain('-- Power Cards --');
  const textImport=await agent.post('/api/v1/decks/import').send({name:'TopDeck round trip',exportData:exported.body.data.topDeck}).expect(201);integrationTestUtils.trackTestDeck(textImport.body.data.deckId);
  const textFull=await agent.get(`/api/v1/decks/${textImport.body.data.deckId}/full`).expect(200);
  expect(textImport.body.data.cardsAdded).toBe(3);expect(textFull.body.data.metadata.is_limited).toBe(false);
  expect(textFull.body.data.cards).toHaveLength(full.body.data.cards.length);
  // Published text preserves the card/set, not a cosmetic foil printing ID.
  const reserveIdentity=async(id:string)=>(await pool.query('SELECT name, set FROM characters WHERE id=$1',[id])).rows[0];
  expect(await reserveIdentity(textFull.body.data.metadata.reserve_character)).toEqual(await reserveIdentity(full.body.data.metadata.reserve_character));
  expect(textFull.body.data.cards).toContainEqual(expect.objectContaining({type:'character',cardId:textFull.body.data.metadata.reserve_character,quantity:1}));
  const cardIdentity=async(c:any)=>{
   if(c.type==='character')return{type:c.type,quantity:c.quantity,...await reserveIdentity(c.cardId)};
   expect(c.type).toBe('power');
   return{type:c.type,quantity:c.quantity,...(await pool.query('SELECT name, power_type, value, set FROM power_cards WHERE id=$1',[c.cardId])).rows[0]};
  };
  const identities=await Promise.all(textFull.body.data.cards.map(cardIdentity));
  for(const c of full.body.data.cards)expect(identities).toContainEqual(await cardIdentity(c));
  const before=(await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows;
  const failure=await agent.post('/api/v1/decks/import').send({name,exportData:{cards:{characters:['Fictional absent identity']}}}).expect(400);expect(failure.body.errors[0].code).toBe('IMPORT_UNRESOLVED');expect((await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows).toEqual(before);
  await agent.post('/api/v1/decks/import').send({name,exportData:'-- Power Cards --\n1x Fictional missing identity'}).expect(400);
  await agent.post('/api/v1/decks/import').send({name,exportData:'-- Power Cards --\n1x 5 Combat\nUnparsed note'}).expect(400);
  expect((await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows).toEqual(before);
  await agent.post('/api/v1/guest/decks/import').send(input).expect(403);
 });
 it('rolls back a real transaction if a later typed identity disappears',async()=>{
  const user=await integrationTestUtils.createTestUser({name:'M7RollbackOwner',email:'m7-rollback@example.invalid'});
  const pool=DataSourceConfig.getInstance().getPool();const before=(await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows;
  const character=(await pool.query("SELECT id FROM characters WHERE name='Lancelot' ORDER BY id LIMIT 1")).rows[0];
  await expect(createImportedDeck(createDeckRepositoryContext(pool,new Map(),0),user.id,{name:'Fictional rollback',description:'',cards:[{type:'character',cardId:character.id,quantity:1},{type:'power',cardId:'00000000-0000-0000-0000-000000000000',quantity:1}],isValid:false,limited:true,reserveCharacterId:null,cardCount:1,threat:18})).rejects.toThrow('no longer available');
  expect((await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows).toEqual(before);
 });
 it('binds Guest import to the authenticated session with no database deck',async()=>{
  const password='Fictional-guest-import-123';const user=await integrationTestUtils.createTestUser({name:'M7ImportGuest',email:'m7-guest@example.invalid',role:'GUEST',password});
  const agent=request.agent(app);await agent.post('/api/auth/login').send({username:user.username,password}).expect(200);
  const input={name:'Fictional Guest import',exportData:{limited:true,cards:{characters:['Lancelot']}}};const r=await agent.post('/api/v1/guest/decks/import').send(input).expect(201);
  try{expect(r.body.data.deckId).toMatch(/^guest_/);const list=await agent.get('/api/v1/guest/decks').expect(200);expect(list.body.data.find((d:any)=>d.metadata.id===r.body.data.deckId).metadata).toMatchObject({is_limited:true,threat:18});const full=await agent.get(`/api/v1/guest/decks/${r.body.data.deckId}`).expect(200);expect(full.body.data.cards).toHaveLength(1);await request(app).get(`/api/v1/guest/decks/${r.body.data.deckId}`).expect(401);expect((await DataSourceConfig.getInstance().getPool().query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows[0].count).toBe('0');}finally{await agent.delete(`/api/v1/guest/decks/${r.body.data.deckId}`).expect(200);}
 });
});
