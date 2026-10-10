import {createHash,randomBytes,randomUUID} from 'crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import request from 'supertest';
import {app} from '../../src/index';
import {DataSourceConfig} from '../../src/config/DataSourceConfig';
import {SERVICE_HEADER} from '../../src/api/access/serviceAccessService';
import {DECKBUILDER_SERVICE_PREFIX as remote,NATIVE_DECKBUILDER_PREFIX as native} from '../../src/api/access/deckbuilderOperations';
import type {ServiceAccessConfig} from '../../src/api/access/serviceAccessConfig';

describe('builder gateways with real production composition and PostgreSQL',()=>{
 const keys=['ENABLE_SERVICE_ACCESS','SERVICE_ACCESS_CONFIG_FILE','APPLICATION_ACCESS_CREDENTIALS_FILE','ENABLE_DATABASE_SERVICE_GATEWAY','ENABLE_NATIVE_DATABASE_SERVICE','ENABLE_DECKBUILDER_SERVICE_GATEWAY','ENABLE_NATIVE_DECKBUILDER_SERVICE'] as const;
 const previous=new Map(keys.map(k=>[k,process.env[k]]));const dir=mkdtempSync(join(tmpdir(),'builder-integration-'));const ids:string[]=[];
 let token:string;let draft:Record<string,unknown>;let before:string;
 const pool=()=>DataSourceConfig.getInstance().getPool();
 beforeAll(async()=>{
  const secrets=['excelsior-web','bmg-deckbuilder'].map(id=>({id,secret:randomBytes(32).toString('base64url')}));
  const config:ServiceAccessConfig={environment:'development',signingSecret:randomBytes(48).toString('base64url'),tokenTtlSeconds:60,clients:secrets.map(({id,secret})=>({id,enabled:true,tokenEpoch:0,requestsPerMinute:600,scopes:id==='excelsior-web'?['catalog:read','decks:read','decks:write','guest:decks']:['catalog:read','decks:read'],credentials:[{version:'v1',secretSha256:createHash('sha256').update(secret).digest('hex')}]}))};
  const registry=join(dir,'registry.json'),credentials=join(dir,'native.json');writeFileSync(registry,JSON.stringify(config),{mode:0o600});writeFileSync(credentials,JSON.stringify({environment:'development',clients:[{clientId:'excelsior-web',clientSecret:secrets[0]!.secret}]}),{mode:0o600});
  for(const key of keys)process.env[key]='1';process.env.SERVICE_ACCESS_CONFIG_FILE=registry;process.env.APPLICATION_ACCESS_CREDENTIALS_FILE=credentials;
  const issued=await request(app).post('/api/service/v1/service-auth/token').send({grant_type:'client_credentials',client_id:'bmg-deckbuilder',client_secret:secrets[1]!.secret,scope:'catalog:read decks:read'}).expect(200);token=issued.body.data.accessToken;
  const catalog=await request(app).get('/api/v1/catalog/presentation/power-cards').expect(200);const power=catalog.body.data.find((c:{one_per_deck?:boolean})=>!c.one_per_deck);expect(power).toBeTruthy();
  draft={schemaVersion:1,draftId:'draft-integration',revision:1,cards:[{type:'power',cardId:power.id,quantity:8}],reserveCharacterId:null,limited:true,format:'venture',koCharacterIds:[]};
  before=JSON.stringify((await pool().query('SELECT (SELECT COUNT(*) FROM decks) AS decks,(SELECT COUNT(*) FROM users) AS users')).rows);
 });
 afterAll(()=>{for(const [k,v] of previous){if(v===undefined)delete process.env[k];else process.env[k]=v;}rmSync(dir,{recursive:true,force:true});});
 it.each(['/decks/evaluate','/decks/candidates/evaluate','/decks/draw','/decks/export'])('preserves stateless %s and verified application identity',async suffix=>{
  const body=suffix.endsWith('candidates/evaluate')?{schemaVersion:1,revision:1,cards:draft.cards,candidates:[]}:suffix.endsWith('/draw')?{draft}:suffix.endsWith('/export')?{draft,display:{name:'Current integration draft',description:'',exportedBy:'Guest',surface:'editor'}}:draft;
  const direct=await request(app).post('/api/v1'+suffix).send(body).expect(200);
  const nid=randomUUID(),bid=randomUUID();ids.push(nid,bid);
  const nr=await request(app).post(native+'/api/v1'+suffix).set('X-Request-Id',nid).send(body).expect(200);
  const br=await request(app).post(remote+suffix).set(SERVICE_HEADER,'Bearer '+token).set('X-Request-Id',bid).set('Cookie','sessionId=fictional-invalid-player').send(body).expect(200);
  expect(nr.headers['cache-control']).toBe('no-store');expect(br.headers['cache-control']).toBe('no-store');expect(br.headers['set-cookie']).toBeUndefined();
  expect(nr.body.data.inputKey).toBe(direct.body.data.inputKey);expect(br.body.data.inputKey).toBe(direct.body.data.inputKey);expect(br.body.data.revision).toBe(1);
  if(suffix.endsWith('/export')){expect(br.body.data.topDeck).toBe(direct.body.data.topDeck);expect(br.body.data.topDeck).toEqual(expect.any(String));expect(br.body.data.topDeck.length).toBeGreaterThan(0);expect(br.body.data.deck).toEqual({...direct.body.data.deck,export_timestamp:br.body.data.deck.export_timestamp});}
 });
 it('denies persistence, admin and absent application identity; native player checks still apply',async()=>{
  await request(app).post(remote+'/guest/decks').set(SERVICE_HEADER,'Bearer '+token).send({name:'Never saved'}).expect(403);
  await request(app).post(remote+'/admin/decks/hand-analysis').set(SERVICE_HEADER,'Bearer '+token).send({}).expect(403);
  await request(app).post(remote+'/decks/draw').send({draft}).expect(401);
  await request(app).put(native+'/api/v1/decks/fictional/cards').send({cards:[]}).expect(401);
  const after=JSON.stringify((await pool().query('SELECT (SELECT COUNT(*) FROM decks) AS decks,(SELECT COUNT(*) FROM users) AS users')).rows);expect(after).toBe(before);
 });
 it('writes one verified DB record per gateway request and aggregate totals agree',async()=>{
  let rows:Array<{request_id:string;application_id:string;identity_verified:boolean;user_id:string|null}>=[];
  for(let i=0;i<30;i++){rows=(await pool().query('SELECT request_id,application_id,identity_verified,user_id FROM api_access_log WHERE request_id=ANY($1)',[ids])).rows;if(rows.length===ids.length)break;await new Promise(r=>setTimeout(r,30));}
  expect(rows).toHaveLength(8);expect(new Set(rows.map(r=>r.request_id)).size).toBe(8);
  for(let i=0;i<ids.length;i++)expect(rows.find(r=>r.request_id===ids[i])).toMatchObject({application_id:i%2?'bmg-deckbuilder':'excelsior',identity_verified:true,user_id:null});
  const mismatch=await pool().query("SELECT a.application_id FROM api_application_hit_counts a LEFT JOIN (SELECT application_id,route_key,method,status,(ts AT TIME ZONE 'UTC')::date AS day,COUNT(*) AS total FROM api_access_log GROUP BY application_id,route_key,method,status,(ts AT TIME ZONE 'UTC')::date) r USING(application_id,route_key,method,status,day) WHERE a.application_id IN ('excelsior','bmg-deckbuilder') AND a.hit_count<>COALESCE(r.total,0)");expect(mismatch.rows).toEqual([]);
 });
});
