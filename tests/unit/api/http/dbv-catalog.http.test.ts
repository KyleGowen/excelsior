import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { registerDbvCatalogV1HttpRoutes } from '../../../../src/api/http/dbv-catalog.http';
import type { CatalogCardRepository } from '../../../../src/api/services/catalogService';
import { CatalogService } from '../../../../src/api/services/catalogService';

const foilStub = () => ({ getFoilCardMap: jest.fn().mockResolvedValue([]) });

const passCatalogAuth: RequestHandler = (_req, _res, next) => {
  next();
};

function buildApp(catalogService: CatalogService): express.Application {
  const app = express();
  const router = express.Router();
  registerDbvCatalogV1HttpRoutes(router, { catalogService, catalogAuth: passCatalogAuth });
  app.use(router);
  return app;
}

describe('dbv-catalog.http', () => {
  it('GET /catalog/characters returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllCharacters: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Hero' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/characters').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'c1', name: 'Hero' }]);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('GET /catalog/characters returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllCharacters: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/characters').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/locations returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllLocations: jest.fn().mockResolvedValue([{ id: 'l1', name: 'Gotham' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/locations').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'l1', name: 'Gotham' }]);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('GET /catalog/battlegrounds returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllBattlegrounds: jest.fn().mockResolvedValue([
        { id: 'b1', name: 'Global Defense Agency' },
      ]),
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/battlegrounds').expect(200);
    expect(res.body.data).toEqual([{ id: 'b1', name: 'Global Defense Agency' }]);
  });

  it('GET /catalog/locations returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllLocations: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/locations').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/special-cards returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllSpecialCards: jest.fn().mockResolvedValue([{ id: 's1', name: 'Ancient Wisdom' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/special-cards').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 's1', name: 'Ancient Wisdom' }]);
  });

  it('GET /catalog/special-cards returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllSpecialCards: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/special-cards').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/missions returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllMissions: jest.fn().mockResolvedValue([{ id: 'm1', card_name: 'Test Mission' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/missions').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'm1', card_name: 'Test Mission' }]);
  });

  it('GET /catalog/missions returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllMissions: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/missions').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/events returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllEvents: jest.fn().mockResolvedValue([{ id: 'e1', name: 'Test Event' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/events').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'e1', name: 'Test Event' }]);
  });

  it('GET /catalog/events returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllEvents: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/events').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/aspects returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllAspects: jest.fn().mockResolvedValue([{ id: 'a1', card_name: 'Test Aspect' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/aspects').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'a1', card_name: 'Test Aspect' }]);
  });

  it('GET /catalog/aspects returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllAspects: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/aspects').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/advanced-universe returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllAdvancedUniverse: jest.fn().mockResolvedValue([{ id: 'au1', name: 'Test UA' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/advanced-universe').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'au1', name: 'Test UA' }]);
  });

  it('GET /catalog/advanced-universe returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllAdvancedUniverse: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/advanced-universe').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/teamwork returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllTeamwork: jest.fn().mockResolvedValue([{ id: 'tw1', card_type: '6 Combat' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/teamwork').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'tw1', card_type: '6 Combat' }]);
  });

  it('GET /catalog/teamwork returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllTeamwork: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/teamwork').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/ally-universe returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllAllyUniverse: jest.fn().mockResolvedValue([{ id: 'a1', card_name: 'Test Ally' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/ally-universe').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'a1', card_name: 'Test Ally' }]);
  });

  it('GET /catalog/ally-universe returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllAllyUniverse: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/ally-universe').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/training returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllTraining: jest.fn().mockResolvedValue([{ id: 't1', card_name: 'Training Card' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/training').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 't1', card_name: 'Training Card' }]);
  });

  it('GET /catalog/training returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllTraining: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/training').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/basic-universe returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllBasicUniverse: jest.fn().mockResolvedValue([{ id: 'bu1', card_name: 'Basic Card' }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/basic-universe').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'bu1', card_name: 'Basic Card' }]);
  });

  it('GET /catalog/basic-universe returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllBasicUniverse: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/basic-universe').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/power-cards returns v1 envelope with data', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllPowerCards: jest.fn().mockResolvedValue([{ id: 'p1', power_type: '6 Combat', value: 6 }])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/power-cards').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual([{ id: 'p1', power_type: '6 Combat', value: 6 }]);
  });

  it('GET /catalog/power-cards returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllPowerCards: jest.fn().mockRejectedValue(new Error('db down'))
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, foilStub());
    const res = await request(buildApp(catalogService)).get('/catalog/power-cards').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });

  it('GET /catalog/foil-card-map returns v1 envelope with data', async () => {
    const foilRows = [{ foilCardId: 'f1', baseCardId: 'b1', cardType: 'power' as const }];
    const cards: Partial<CatalogCardRepository> = {
      getAllCharacters: jest.fn().mockResolvedValue([])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, {
      getFoilCardMap: jest.fn().mockResolvedValue(foilRows)
    });
    const res = await request(buildApp(catalogService)).get('/catalog/foil-card-map').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.meta).toEqual(expect.objectContaining({ catalogDataVersion: expect.any(Number) }));
    expect(res.body.data).toEqual(foilRows);
  });

  it('GET /catalog/foil-card-map returns 500 on service error', async () => {
    const cards: Partial<CatalogCardRepository> = {
      getAllCharacters: jest.fn().mockResolvedValue([])
    };
    const catalogService = new CatalogService(cards as CatalogCardRepository, {
      getFoilCardMap: jest.fn().mockRejectedValue(new Error('db down'))
    });
    const res = await request(buildApp(catalogService)).get('/catalog/foil-card-map').expect(500);
    expect(res.body.data).toBeNull();
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].code).toBe('CATALOG_ERROR');
  });
});

describe('M4 catalog presentation HTTP contract', () => {
  const makeService = () => new CatalogService({ getAllCharacters: jest.fn().mockResolvedValue([{ id: 'a', name: 'Hero' }]) } as unknown as CatalogCardRepository, foilStub());
  it.each(['characters','special-cards','power-cards','locations','battlegrounds','missions','events','aspects','advanced-universe','teamwork','ally-universe','training','basic-universe'])('registers and delegates the %s presentation contract', async type => {
    const service = makeService();
    const read = jest.spyOn(service, 'getPresentation').mockResolvedValue([]);
    const response = await request(buildApp(service)).get('/catalog/presentation/' + type).expect(200);
    expect(read).toHaveBeenCalledWith(type);
    expect(response.body.data).toEqual([]);
    expect(response.headers.etag).toBeDefined();
  });
  it('returns enriched rows with the existing envelope and honors conditional GET', async () => {
    const app = buildApp(makeService());
    const response = await request(app).get('/catalog/presentation/characters').expect(200);
    expect(response.body.data[0]).toMatchObject({ id: 'a', name: 'Hero', presentation: { schemaVersion: 1, printingId: 'a', addDefaultPrintingId: 'a' } });
    await request(app).get('/catalog/presentation/characters').set('If-None-Match', response.headers.etag).expect(304);
  });
  it('returns a catalog error on presentation service failure', async () => {
    const service = makeService(); jest.spyOn(service, 'getPresentation').mockRejectedValue(new Error('fictional outage'));
    const response = await request(buildApp(service)).get('/catalog/presentation/characters').expect(500);
    expect(response.body.data).toBeNull(); expect(response.body.errors[0].code).toBe('CATALOG_ERROR');
  });
  it('does not expose unknown type routes', async () => {
    await request(buildApp(makeService())).get('/catalog/presentation/unsupported').expect(404);
  });
  it('enforces the existing catalog auth middleware before service access', async () => {
    const service = makeService(); const read = jest.spyOn(service, 'getPresentation');
    const app = express(); const router = express.Router();
    registerDbvCatalogV1HttpRoutes(router, { catalogService: service, catalogAuth: (_req, res) => { res.status(401).end(); } });
    app.use(router); await request(app).get('/catalog/presentation/characters').expect(401); expect(read).not.toHaveBeenCalled();
  });
});
