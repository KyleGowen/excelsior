import request from 'supertest';
import {app} from '../../../src/test-server';
import {DataSourceConfig} from '../../../src/config/DataSourceConfig';
import {integrationTestUtils} from '../../setup-integration';
import {createImportedDeck} from '../../../src/database/deck/deck-crud';
import {createDeckRepositoryContext} from '../../../src/database/deck/context';
describe('Atomic import real HTTP and persistence',()=>{
 it('persists all cards and metadata once, and leaves no unresolved partial deck',async()=>{
  const password='Fictional-import-only-123';const user=await integrationTestUtils.createTestUser({name:'M7ImportOwner',email:'m7-import@example.invalid',password});
  const agent=request.agent(app);await agent.post('/api/auth/login').send({username:user.username,password}).expect(200);
  const pool=DataSourceConfig.getInstance().getPool();
  const name='M7 fictional atomic import';
  const input={name,exportData:{limited:true,reserve_character:'Lancelot',cards:{characters:['Lancelot'],power_cards:['5 - Combat','5 - Combat']}}};
  const imported=await agent.post('/api/v1/decks/import').send(input).expect(201);const id=imported.body.data.deckId;integrationTestUtils.trackTestDeck(id);
  expect(imported.body.data).toMatchObject({ok:true,userId:user.id,cardsAdded:3});
  const full=await agent.get(`/api/v1/decks/${id}/full`).expect(200);expect(full.body.data.cards).toHaveLength(2);expect(full.body.data.metadata.is_limited).toBe(true);expect(full.body.data.metadata.reserve_character).toBeTruthy();expect(full.body.data.evaluation.counts.physicalPlayable).toBe(2);
  const before=(await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows;
  const failure=await agent.post('/api/v1/decks/import').send({name,exportData:{cards:{characters:['Fictional absent identity']}}}).expect(400);expect(failure.body.errors[0].code).toBe('IMPORT_UNRESOLVED');expect((await pool.query('SELECT count(*) FROM decks WHERE user_id=$1',[user.id])).rows).toEqual(before);
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
