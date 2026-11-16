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
 let token:string;let catalogToken:string;let draft:Record<string,unknown>;let before:string;
 const pool=()=>DataSourceConfig.getInstance().getPool();
 beforeAll(async()=>{
  const secrets=['excelsior-web','bmg-deckbuilder'].map(id=>({id,secret:randomBytes(32).toString('base64url')}));
  const config:ServiceAccessConfig={environment:'development',signingSecret:randomBytes(48).toString('base64url'),tokenTtlSeconds:60,clients:secrets.map(({id,secret})=>({id,enabled:true,tokenEpoch:0,requestsPerMinute:600,scopes:id==='excelsior-web'?['catalog:read','decks:read','decks:write','guest:decks']:['catalog:read','decks:read'],credentials:[{version:'v1',secretSha256:createHash('sha256').update(secret).digest('hex')}]}))};
  const registry=join(dir,'registry.json'),credentials=join(dir,'native.json');writeFileSync(registry,JSON.stringify(config),{mode:0o600});writeFileSync(credentials,JSON.stringify({environment:'development',clients:[{clientId:'excelsior-web',clientSecret:secrets[0]!.secret}]}),{mode:0o600});
  for(const key of keys)process.env[key]='1';process.env.SERVICE_ACCESS_CONFIG_FILE=registry;process.env.APPLICATION_ACCESS_CREDENTIALS_FILE=credentials;
  const issued=await request(app).post('/api/service/v1/service-auth/token').send({grant_type:'client_credentials',client_id:'bmg-deckbuilder',client_secret:secrets[1]!.secret,scope:'catalog:read decks:read'}).expect(200);token=issued.body.data.accessToken;
  const catalogCredential = await request(app).post('/api/service/v1/service-auth/token')
    .send({ grant_type: 'client_credentials', client_id: 'bmg-deckbuilder', client_secret: secrets[1]!.secret, scope: 'catalog:read' }).expect(200);
  catalogToken = catalogCredential.body.data.accessToken;
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
 it('serves only the configured account’s newest legal public decks and full copy cards', async () => {
  const path = '/api/v1/decks/featured';
  const alias = '/api/service/v1/decks/featured';
  const setting = process.env.FEATURED_DECKS_USER_ID;
  const featured = randomUUID();
  const other = randomUUID();
  const sourceDeck = 'a3520001-0000-4000-8000-000000000001';
  const db = pool();
  try {
    delete process.env.FEATURED_DECKS_USER_ID;
    expect((await request(app).get('/api/v1/config/app').expect(200)).body.featuredDecksUserId).toBeUndefined();
    expect((await request(app).get(path).expect(200)).body.data).toEqual([]);
    await request(app).get(alias).expect(401);
    await request(app).get(alias).set(SERVICE_HEADER, 'Bearer ' + catalogToken).expect(403);
    await request(app).get(path).set(SERVICE_HEADER, 'Bearer ' + catalogToken).expect(403);
    await request(app).get(alias + '/full').set(SERVICE_HEADER, 'Bearer ' + token).expect(403);
    await request(app).post(alias).set(SERVICE_HEADER, 'Bearer ' + token).expect(403);

    process.env.FEATURED_DECKS_USER_ID = featured.toUpperCase();
    expect((await request(app).get('/api/v1/config/app').expect(200)).body.featuredDecksUserId).toBe(featured);
    await db.query(`INSERT INTO users (id, username, email, password_hash, role)
      SELECT id, id::text, id::text || '@example.test', 'disabled-fixture', 'USER'
      FROM unnest($1::uuid[]) AS t(id)`, [[featured, other]]);
    const ids = Array.from({ length: 53 }, () => randomUUID());
    await db.query(`INSERT INTO decks (id, user_id, name, is_private, is_limited, is_valid)
      SELECT id, CASE WHEN ord = 52 THEN $2::uuid ELSE $3::uuid END,
        'Featured fixture ' || ord, ord = 50, ord = 53, ord <> 51
      FROM unnest($1::uuid[]) WITH ORDINALITY AS t(id, ord)`, [ids, other, featured]);
    await db.query(`INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, exclude_from_draw, display_order)
      SELECT t.id, cards.card_type, cards.card_id,
        CASE WHEN ord <> 53 AND cards.card_type = 'power' THEN cards.quantity * 2 ELSE cards.quantity END,
        COALESCE(cards.exclude_from_draw, false) OR cards.id = (
          SELECT original.id FROM deck_cards original WHERE original.deck_id = $2 AND original.card_type = 'special'
          ORDER BY original.display_order, original.id LIMIT 1
        ), cards.display_order
      FROM unnest($1::uuid[]) WITH ORDINALITY AS t(id, ord)
      CROSS JOIN deck_cards cards WHERE cards.deck_id = $2`, [ids, sourceDeck]);
    // Individual transactions give each update a distinct timestamp from the normal trigger.
    for (const [index, id] of ids.entries()) {
      await db.query('UPDATE decks SET is_valid = $2, updated_at = clock_timestamp() WHERE id = $1',
        [id, index !== 50]);
    }

    const response = await request(app).get(alias + '?userId=' + other)
      .set(SERVICE_HEADER, 'Bearer ' + token).set('Cookie', 'sessionId=fictional-player')
      .expect('Cache-Control', 'no-store').expect(200);
    expect(response.headers['set-cookie']).toBeUndefined();
    const decks = response.body.data;
    // The newest SQL candidate (53) is Limited and only passes the saved flag.
    // The bound is applied before evaluating candidates, so it leaves 47 rows.
    expect(decks.map((row: { id: string }) => row.id)).toEqual(ids.slice(2, 49).reverse());
    expect(decks[0]).toMatchObject({
      metadata: { userId: featured, isOwner: false, is_private: false, is_limited: false },
      evaluation: { legality: { valid: true, rawValid: true } },
    });
    expect(decks[0].cards.some((card: { type: string }) => card.type === 'power')).toBe(false);
    const copyCards = await db.query(`SELECT card_type AS type, card_id AS "cardId", quantity, exclude_from_draw
      FROM deck_cards WHERE deck_id = $1 ORDER BY display_order NULLS LAST, id`, [ids[48]]);
    expect(decks[0].deckCards).toEqual(copyCards.rows);
    expect(decks[0].deckCards.some((card: { exclude_from_draw: boolean }) => card.exclude_from_draw)).toBe(true);

    await db.query('UPDATE decks SET is_private = true WHERE id = $1', [ids[48]]);
    const direct = await request(app).get(path).expect('Cache-Control', 'no-store').expect(200);
    expect(direct.body.data.map((row: { id: string }) => row.id)).not.toContain(ids[48]);
  } finally {
    if (setting === undefined) delete process.env.FEATURED_DECKS_USER_ID;
    else process.env.FEATURED_DECKS_USER_ID = setting;
    await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[featured, other]]);
  }
 });

});
