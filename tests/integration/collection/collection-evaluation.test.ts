import request from 'supertest';
import {app} from '../../../src/test-server';
import {integrationTestUtils} from '../../setup-integration';
import {randomBytes} from 'crypto';
import {DataSourceConfig} from '../../../src/config/DataSourceConfig';
/** Real app wiring/persistence; tracked fictional users cleaned by integration setup. */
describe('authoritative collection views and stateless Guest snapshots',()=>{
 let firstCookie:string,secondCookie:string,cardId:string;
 const password=randomBytes(24).toString('base64url');
 const cookies=(r:request.Response)=>(r.headers['set-cookie'] as unknown as string[]).map(c=>c.split(';')[0]).join('; ');
 beforeAll(async()=>{
  const first=await integrationTestUtils.createTestUser({name:'M8First',email:'first@example.test',password});const second=await integrationTestUtils.createTestUser({name:'M8Second',email:'second@example.test',password});
  firstCookie=cookies(await request(app).post('/api/auth/login').send({username:first.username,password}).expect(200));
  secondCookie=cookies(await request(app).post('/api/auth/login').send({username:second.username,password}).expect(200));
  const c=await DataSourceConfig.getInstance().getPool().query('SELECT id FROM characters ORDER BY id LIMIT 1');cardId=c.rows[0].id;
 });
 it('adds, reloads and removes a printing while deriving current saved totals and ownership',async()=>{
  await request(app).post('/api/v1/collections/me/cards').set('Cookie',firstCookie).send({cardId,cardType:'character',quantity:2,imagePath:'fictional-base.webp'}).expect(200);
  const first=await request(app).get('/api/v1/collections/me/view').set('Cookie',firstCookie).expect(200);expect(first.body.data.evaluation.totalOwned).toBe(2);expect(first.body.data.evaluation.uniqueCards).toBe(1);expect(first.body.data.evaluation.capabilities.storage).toBe('account');expect(first.headers['cache-control']).toBe('no-store');
  const other=await request(app).get('/api/v1/collections/me/view').set('Cookie',secondCookie).expect(200);expect(other.body.data.evaluation.totalOwned).toBe(0);expect(other.body.data.cards).toHaveLength(0);
  await request(app).put('/api/v1/collections/me/cards/'+cardId).set('Cookie',firstCookie).send({cardType:'character',quantity:0,imagePath:'fictional-base.webp'}).expect(200);
  const empty=await request(app).get('/api/v1/collections/me/view').set('Cookie',firstCookie).expect(200);expect(empty.body.data.evaluation.totalOwned).toBe(0);
 });
 it('does not create collections for unauthenticated device evaluation',async()=>{
  const pool=DataSourceConfig.getInstance().getPool();const before=await pool.query('SELECT count(*)::int AS n FROM collections');
  const r=await request(app).post('/api/v1/collections/evaluate').send({entries:[{cardId,cardType:'character',imagePath:'fictional-foil.webp',quantity:3}]}).expect(200);expect(r.body.data.totalOwned).toBe(3);expect(r.body.data.capabilities.storage).toBe('device');
  const after=await pool.query('SELECT count(*)::int AS n FROM collections');expect(after.rows[0].n).toBe(before.rows[0].n);
 });
 it('requires player authorization for saved data and rejects trusted actor injection',async()=>{await request(app).get('/api/v1/collections/me/view').expect(401);await request(app).post('/api/v1/collections/evaluate').send({entries:[],userId:'other'}).expect(400);});
});
