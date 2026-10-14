import type { CatalogCardRepository } from '../../../../src/api/services/catalogService';
import { CatalogService } from '../../../../src/api/services/catalogService';

const emptyStats = {
  characters: 0,
  locations: 0,
  battlegrounds: 0,
  specialCards: 0,
  missions: 0,
  events: 0,
  aspects: 0,
  advancedUniverse: 0,
  teamwork: 0,
  allyUniverse: 0,
  training: 0,
  basicUniverse: 0,
  powerCards: 0
};

function stubCards(overrides: Partial<CatalogCardRepository> = {}): CatalogCardRepository {
  const base: CatalogCardRepository = {
    getAllCharacters: jest.fn().mockResolvedValue([]),
    getAllLocations: jest.fn().mockResolvedValue([]),
    getAllBattlegrounds: jest.fn().mockResolvedValue([]),
    getAllSpecialCards: jest.fn().mockResolvedValue([]),
    getAllMissions: jest.fn().mockResolvedValue([]),
    getAllEvents: jest.fn().mockResolvedValue([]),
    getAllAspects: jest.fn().mockResolvedValue([]),
    getAllAdvancedUniverse: jest.fn().mockResolvedValue([]),
    getAllTeamwork: jest.fn().mockResolvedValue([]),
    getAllAllyUniverse: jest.fn().mockResolvedValue([]),
    getAllTraining: jest.fn().mockResolvedValue([]),
    getAllBasicUniverse: jest.fn().mockResolvedValue([]),
    getAllPowerCards: jest.fn().mockResolvedValue([]),
    getCardStats: jest.fn().mockResolvedValue(emptyStats)
  };
  return { ...base, ...overrides };
}

const stubFoil = () => ({ getFoilCardMap: jest.fn().mockResolvedValue([]) });
const stubErrata = (entries: any[] = []) => ({
  getAllCardErrata: jest.fn().mockResolvedValue(entries)
});

describe('CatalogService', () => {
  it('getAllCharacters delegates to card repository', async () => {
    const cards = stubCards({
      getAllCharacters: jest.fn().mockResolvedValue([{ id: 'a' }])
    });
    const svc = new CatalogService(cards, stubFoil());
    const out = await svc.getAllCharacters();
    expect(out).toEqual([{ id: 'a' }]);
    expect(cards.getAllCharacters).toHaveBeenCalledTimes(1);
  });

  it('getFoilCardMap delegates to foil repository', async () => {
    const foil = { getFoilCardMap: jest.fn().mockResolvedValue([{ foil_card_id: 'f1' }]) };
    const svc = new CatalogService(stubCards(), foil);
    const out = await svc.getFoilCardMap();
    expect(out).toEqual([{ foil_card_id: 'f1' }]);
    expect(foil.getFoilCardMap).toHaveBeenCalledTimes(1);
  });

  it('getCardStats delegates to card repository', async () => {
    const cards = stubCards({
      getCardStats: jest.fn().mockResolvedValue({ ...emptyStats, characters: 5 })
    });
    const svc = new CatalogService(cards, stubFoil());
    const stats = await svc.getCardStats();
    expect(stats.characters).toBe(5);
    expect(cards.getCardStats).toHaveBeenCalledTimes(1);
  });

  it('adds ordered errata only to the linked card type and printing', async () => {
    const cards = stubCards({
      getAllSpecialCards: jest.fn().mockResolvedValue([
        { id: 'special-1', name: 'I am Immortal' },
        { id: 'special-2', name: 'Unlinked' }
      ])
    });
    const errata = stubErrata([
      {
        card_type: 'special',
        card_id: 'special-1',
        id: 'errata-12',
        source_section: 12,
        entry_title: 'I am Immortal',
        entry_text: 'Second ruling.',
        source_url: 'https://overpowercardgame.com/errata/#s12'
      },
      {
        card_type: 'special',
        card_id: 'special-1',
        id: 'errata-1',
        source_section: 1,
        entry_title: 'Absolute KO',
        entry_text: 'First ruling.',
        source_url: 'https://overpowercardgame.com/errata/#s1'
      },
      {
        card_type: 'character',
        card_id: 'special-1',
        id: 'wrong-type',
        source_section: 18,
        entry_title: 'Wrong type',
        entry_text: 'Must not appear.',
        source_url: 'https://overpowercardgame.com/errata/#s18'
      }
    ]);

    const svc = new CatalogService(cards, stubFoil(), errata);
    const output = await svc.getAllSpecialCards();

    expect(output).toEqual([
      {
        id: 'special-1',
        name: 'I am Immortal',
        errata: [
          expect.objectContaining({ id: 'errata-1', source_section: 1 }),
          expect.objectContaining({ id: 'errata-12', source_section: 12 })
        ]
      },
      { id: 'special-2', name: 'Unlinked' }
    ]);
    expect(errata.getAllCardErrata).toHaveBeenCalledTimes(1);
  });
});


describe('CatalogService presentation cache', () => {
  const special = { id: 'special-1', name: 'Battle Cry', character: 'Hero', set: 'SKY', set_number: '1' };

  function fixture() {
    const cards = stubCards({
      getAllSpecialCards: jest.fn().mockResolvedValue([{ ...special }]),
      getAllCharacters: jest.fn().mockResolvedValue([{ id: 'hero-1', name: 'Hero', set: 'SKY' }]),
    });
    const foil = stubFoil();
    const errata = stubErrata();
    return { cards, foil, errata, service: new CatalogService(cards, foil, errata) };
  }

  it('reuses completed presentation for identical content, including concurrent requests', async () => {
    const { service, cards, foil, errata } = fixture();
    const [first, second] = await Promise.all([
      service.getPresentation('special-cards'), service.getPresentation('special-cards'),
    ]);
    expect(second).toBe(first);
    expect(first[0].presentation.catalogVersion).toMatch(/^[a-f0-9]{64}$/);
    expect(cards.getAllSpecialCards).toHaveBeenCalledTimes(2);
    expect(foil.getFoilCardMap).toHaveBeenCalledTimes(2);
    expect(errata.getAllCardErrata).toHaveBeenCalledTimes(4);
  });

  it.each(['card', 'foil', 'errata', 'linked character'] as const)('rebuilds when %s inputs change', async (input) => {
    const { service, cards, foil, errata } = fixture();
    const first = await service.getPresentation('special-cards');
    if (input === 'card') {
      (cards.getAllSpecialCards as jest.Mock).mockResolvedValue([{ ...special, name: 'Updated Battle Cry' }]);
    } else if (input === 'foil') {
      foil.getFoilCardMap.mockResolvedValue([{ baseCardId: special.id, foilCardId: 'foil-1', cardType: 'special' }]);
    } else if (input === 'errata') {
      errata.getAllCardErrata.mockResolvedValue([{
        card_type: 'special', card_id: special.id, id: 'errata-1', source_section: 1,
        entry_title: 'Ruling', entry_text: 'Updated ruling.', source_url: 'https://example.test/errata',
      }]);
    } else {
      (cards.getAllCharacters as jest.Mock).mockResolvedValue([{ id: 'hero-1', name: 'Other Hero', set: 'SKY' }]);
    }
    const second = await service.getPresentation('special-cards');
    expect(second).not.toBe(first);
    expect(second[0].presentation.catalogVersion).not.toBe(first[0].presentation.catalogVersion);
    if (input === 'card') expect(second[0].name).toBe('Updated Battle Cry');
    if (input === 'foil') expect(second[0].presentation.foilPrintingId).toBe('foil-1');
    if (input === 'errata') expect(second[0].errata).toEqual([expect.objectContaining({ entry_text: 'Updated ruling.' })]);
    if (input === 'linked character') expect(second[0].presentation.characterNames).toEqual([]);
    expect(await service.getPresentation('special-cards')).toBe(second);
  });

  it('does not serve an old cached result when a repository fails, and recovers on retry', async () => {
    const { service, cards } = fixture();
    const first = await service.getPresentation('special-cards');
    (cards.getAllSpecialCards as jest.Mock).mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.getPresentation('special-cards')).rejects.toThrow('database unavailable');
    expect(await service.getPresentation('special-cards')).toBe(first);
  });

  it('keeps types and service instances independent, including empty catalogs', async () => {
    const { service, cards, foil, errata } = fixture();
    const characters = await service.getPresentation('characters');
    const specials = await service.getPresentation('special-cards');
    const empty = await service.getPresentation('locations');
    expect(await service.getPresentation('characters')).toBe(characters);
    expect(await service.getPresentation('special-cards')).toBe(specials);
    expect(await service.getPresentation('locations')).toBe(empty);
    const other = new CatalogService(cards, foil, errata);
    expect(await other.getPresentation('characters')).toEqual(characters);
    expect(await other.getPresentation('characters')).not.toBe(characters);
  });
});
