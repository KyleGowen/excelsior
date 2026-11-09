import express from 'express';
import request from 'supertest';
import { registerAccountDeckRoutes } from '../../../src/api/http/account-decks.http';
import { AccountDeckError, AccountDeckService } from '../../../src/api/services/accountDeckService';
import { DraftStructureError } from '../../../src/api/services/deckDraftEvaluationService';
import { AccountDeckSnapshotRequestBody } from '../../../src/api/http/models/decks/AccountDeckSnapshotRequestBody';

const id = '30000000-0000-4000-8000-000000000001';
const input = () => ({ operationId: id, deckId: null, expectedUpdatedAt: null, name: 'Synthetic', cards: [], reserveCharacterId: null, limited: false });
describe('confidential current-player deck HTTP contract', () => {
 const list = jest.fn(), load = jest.fn(), save = jest.fn();
 let role = 'USER'; let actor = true;
 const makeApp = (original = true, scope = true) => {
  const app = express(); app.use(express.json()); app.use((req, _res, next) => {
   if (original) Object.defineProperty(req, 'originalUrl', { value: '/api/service/account/v1/decks', configurable: true });
   if (scope) req.serviceClient = { clientId: 'fixture', scopes: ['account:self','decks:read','decks:write'] } as NonNullable<typeof req.serviceClient>;
   next();
  });
  registerAccountDeckRoutes(app, { list, load, save } as unknown as AccountDeckService, (req, _res, next) => { if (actor) req.user = { id: 'current-player', role } as NonNullable<typeof req.user>; next(); });
  return app;
 };
 beforeEach(() => { process.env.ENABLE_ACCOUNT_DECK_GATEWAY = '1'; role = 'USER'; actor = true; list.mockReset().mockResolvedValue([]); load.mockReset().mockResolvedValue({ id }); save.mockReset().mockResolvedValue({ id }); });
 afterAll(() => delete process.env.ENABLE_ACCOUNT_DECK_GATEWAY);
 it('uses only the authenticated actor and strict validated snapshots', async () => {
  const app = makeApp(); await request(app).get('/api/account-decks').expect(200); expect(list).toHaveBeenCalledWith('current-player');
  await request(app).get('/api/account-decks/'+id+'/full').expect(200); expect(load).toHaveBeenCalledWith(id,'current-player');
  await request(app).post('/api/account-decks/save').send(input()).expect(200); expect(save).toHaveBeenCalledWith('current-player',input());
  for (const patch of [{ userId: 'other' }, { role: 'ADMIN' }, { deckId: id }, { expectedUpdatedAt: 'bad' }, { cards: [{ type: 'invalid',cardId:id,quantity:1 }] }]) await request(app).post('/api/account-decks/save').send({ ...input(), ...patch }).expect(400);
 });
 it('denies native aliases, disabled gateways, missing service scope and guest actors', async () => {
  await request(makeApp(false)).get('/api/account-decks').expect(403); await request(makeApp(true,false)).get('/api/account-decks').expect(403);
  delete process.env.ENABLE_ACCOUNT_DECK_GATEWAY; await request(makeApp()).get('/api/account-decks').expect(403); process.env.ENABLE_ACCOUNT_DECK_GATEWAY='1';
  role='GUEST'; await request(makeApp()).post('/api/account-decks/save').send(input()).expect(403); actor=false; await request(makeApp()).get('/api/account-decks').expect(403);
 });
 it('maps domain, structure and unavailable errors to sanitized envelopes', async () => {
  const app=makeApp();
  for (const [failure,status,code] of [[new AccountDeckError(409,'DECK_SAVE_CONFLICT'),409,'DECK_SAVE_CONFLICT'],[new DraftStructureError('INVALID_DRAFT'),400,'VALIDATION_ERROR'],[new Error('PRIVATE_DIAGNOSTIC'),503,'DECK_SERVICE_UNAVAILABLE']] as const) {
   save.mockRejectedValueOnce(failure); const response=await request(app).post('/api/account-decks/save').send(input()).expect(status); expect(response.body.errors[0].code).toBe(code); expect(JSON.stringify(response.body)).not.toContain('PRIVATE_DIAGNOSTIC');
  }
 });
 it('evaluates on the backend before persistence and reports absent decks', async () => {
  const repository = { list: jest.fn(async () => []), load: jest.fn(async () => null), save: jest.fn(async () => ({ metadata: {}, cards: [], updatedAt: 'fixture' })) };
  const evaluator = { library:jest.fn(async (v:unknown)=>v),evaluate: jest.fn(async () => ({ legality:{valid:false},counts:{drawPile:0},threat:{editor:0} })), attach:jest.fn(async (v: unknown) => v) };
  const service = new AccountDeckService(repository as unknown as ConstructorParameters<typeof AccountDeckService>[0],evaluator as unknown as ConstructorParameters<typeof AccountDeckService>[1]);
  expect(await service.list('player')).toEqual([]); await expect(service.load(id,'player')).rejects.toMatchObject({status:404});
  await service.save('player',AccountDeckSnapshotRequestBody.parse(input())); expect(repository.save).toHaveBeenCalledWith('player',input(),{valid:false,cardCount:0,threat:0}); expect(evaluator.attach).toHaveBeenCalled();
 });
});
