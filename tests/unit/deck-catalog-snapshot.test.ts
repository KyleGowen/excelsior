import { createHash } from 'crypto';
import { DeckCatalogSnapshotCache, deckCatalogArtifacts } from '../../src/services/deck-validation/catalogSnapshot';
import { buildAvailableCardsMap, type DeckCatalogBundle } from '../../src/services/deck-validation/build-available-cards-map';
import { DeckValidationService } from '../../src/services/deckValidationService';
import type { CardRepository } from '../../src/repository/CardRepository';

const fixture = (): DeckCatalogBundle => ({
  allCharacters: [{ id: 'hero', name: 'Hero', energy: 7, special_abilities: '', nested: { ruling: 'Original' } }],
  allSpecialCards: [], allPowerCards: [], allMissions: [], allEvents: [], allLocations: [], allBattlegrounds: [],
  allAspects: [], allAdvancedUniverse: [], allTeamwork: [], allAllyUniverse: [], allTraining: [],
  allBasicUniverse: [{ id: 'basic', type: 'Energy', value_to_use: '6', bonus: '+2' }],
} as unknown as DeckCatalogBundle);

describe('versioned deck catalog snapshot', () => {
  it('reuses maps and artifacts only for unchanged complete content', () => {
    const cache = new DeckCatalogSnapshotCache(); const bundle = fixture();
    const first = cache.resolve(bundle); const original = buildAvailableCardsMap(bundle);
    expect([...first]).toEqual([...original]);
    expect(cache.resolve(structuredClone(bundle))).toBe(first);
    expect(deckCatalogArtifacts(first)).toBe(deckCatalogArtifacts(first));
    expect(deckCatalogArtifacts(first).version).toBe(createHash('sha256').update(JSON.stringify([...original])).digest('hex'));
    expect(deckCatalogArtifacts(first).preview.get('basic-universe:basic')?.type).toBe('Energy');
    bundle.allCharacters[0].energy = 8;
    const second = cache.resolve(bundle);
    expect(second).not.toBe(first);
    expect(second.get('character_hero')?.energy).toBe(8);
    expect(first.get('character_hero')?.energy).toBe(7);
    expect(deckCatalogArtifacts(second).version).not.toBe(deckCatalogArtifacts(first).version);
  });
  it.each(Object.keys(fixture()) as Array<keyof DeckCatalogBundle>)('invalidates when %s changes', key => {
    const cache = new DeckCatalogSnapshotCache(); const bundle = fixture(); const first = cache.resolve(bundle);
    (bundle[key] as unknown[]).push({ id: 'new-printing', name: 'Added card' });
    expect(cache.resolve(bundle)).not.toBe(first);
  });
  it('isolates nested input mutations and prevents consumers from poisoning shared maps/rows', () => {
    const bundle = fixture(); const cache = new DeckCatalogSnapshotCache(); const catalog = cache.resolve(bundle);
    const preview = deckCatalogArtifacts(catalog).preview;
    expect(() => catalog.set('other', {})).toThrow('read-only');
    expect(() => catalog.delete('character_hero')).toThrow('read-only');
    expect(() => preview.clear()).toThrow('read-only');
    expect(() => { catalog.get('character_hero')!.energy = 99; }).toThrow();
    expect(() => { (preview.get('character:hero')!.nested as { ruling: string }).ruling = 'Changed'; }).toThrow();
    expect(cache.resolve(bundle)).toBe(catalog);
  });
  it('does not memoize mutable caller-supplied maps', () => {
    const map = buildAvailableCardsMap(fixture()); const before = deckCatalogArtifacts(map);
    map.get('character_hero')!.energy = 1;
    const after = deckCatalogArtifacts(map);
    expect(after.version).not.toBe(before.version);
    expect(after.preview.get('character:hero')?.energy).toBe(1);
  });
  it('still reads every repository category and rejects a failed refresh instead of serving old data', async () => {
    const bundle = fixture(); const methods = ['Characters','SpecialCards','PowerCards','Missions','Events','Locations','Battlegrounds','Aspects','AdvancedUniverse','Teamwork','AllyUniverse','Training','BasicUniverse'];
    const repo = Object.fromEntries(methods.map((name, i) => ['getAll'+name, jest.fn().mockResolvedValue(Object.values(bundle)[i])]));
    const service = new DeckValidationService(repo as unknown as CardRepository);
    const first = await service.resolveCatalog(); expect(await service.resolveCatalog()).toBe(first);
    for (const fn of Object.values(repo)) expect(fn).toHaveBeenCalledTimes(2);
    repo.getAllPowerCards.mockRejectedValueOnce(new Error('catalog unavailable'));
    await expect(service.resolveCatalog()).rejects.toThrow('catalog unavailable');
    expect(await service.resolveCatalog()).toBe(first);
    const other = new DeckValidationService(repo as unknown as CardRepository);
    expect(await other.resolveCatalog()).not.toBe(first);
  });
});
