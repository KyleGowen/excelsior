import request from 'supertest';
import {app} from '../../../src/test-server';
import {DataSourceConfig} from '../../../src/config/DataSourceConfig';
import {integrationTestUtils} from '../../setup-integration';
import {evaluationInputKey} from '../../../src/services/deck-evaluation/draftInput';
describe('Server-composed preview with real catalog',()=>{
 it('draws, exports and summarizes a real draft without record writes',async()=>{
  const pool=DataSourceConfig.getInstance().getPool();
  const counts=()=>pool.query('SELECT (SELECT count(*) FROM decks) AS decks,(SELECT count(*) FROM users) AS users,(SELECT count(*) FROM collection_cards) AS cards');
  const before=(await counts()).rows;
  const character=(await pool.query("SELECT id FROM characters WHERE name='Lancelot' ORDER BY id LIMIT 1")).rows[0];
  const power=(await pool.query("SELECT id FROM power_cards WHERE value=5 AND power_type='Combat' ORDER BY id LIMIT 1")).rows[0];
  const draft={schemaVersion:1 as const,draftId:'fictional-preview',revision:4,cards:[{type:'character',cardId:character.id,quantity:1},{type:'power',cardId:power.id,quantity:8,exclude_from_draw:true}],reserveCharacterId:null,limited:true,format:'venture' as const,koCharacterIds:[]};
  const draw=await request(app).post('/api/v1/decks/draw').send({draft}).expect(200);
  expect(draw.headers['cache-control']).toBe('no-store');expect(draw.body.data.cards).toHaveLength(7);expect(draw.body.data.inputKey).toBe(evaluationInputKey(draft));
  const exported=await request(app).post('/api/v1/decks/export').send({draft,display:{name:'Fictional export',description:'',exportedBy:'Fictional guest',surface:'selection'}}).expect(200);
  expect(exported.body.data.deck).toMatchObject({name:'Fictional export',total_cards:8,max_combat:7,total_threat:18});expect(exported.body.data.deck.cards.power_cards).toHaveLength(8);
  const summaries=await request(app).post('/api/v1/decks/summaries').send({drafts:[draft]}).expect(200);expect(summaries.body.data[0]).toMatchObject({draftId:draft.draftId,grid:{combat:7}});
  await request(app).post('/api/v1/admin/decks/hand-analysis').send({draft,hand:[]}).expect(401);
  expect((await counts()).rows).toEqual(before);
 });
 it('checks administrator identity from a real session before analyzing copies',async()=>{
  const password='Fictional-preview-only-123';const user=await integrationTestUtils.createTestUser({name:'M7PreviewAdmin',email:'m7-admin@example.invalid',role:'ADMIN',password});
  const agent=request.agent(app);await agent.post('/api/auth/login').send({username:user.username,password}).expect(200);
  const power=(await DataSourceConfig.getInstance().getPool().query("SELECT id FROM power_cards WHERE value=5 AND power_type='Combat' ORDER BY id LIMIT 1")).rows[0];
  const draft={schemaVersion:1,draftId:'fictional-admin',revision:3,cards:[{type:'power',cardId:power.id,quantity:8}]};
  const r=await agent.post('/api/v1/admin/decks/hand-analysis').send({draft,hand:[{type:'power',cardId:power.id},{type:'power',cardId:power.id}]}).expect(200);
  expect(r.body.data.duplicateCardIndexes).toEqual([0,1]);expect(r.body.data.duplicateCount).toBe(1);
 });
});
