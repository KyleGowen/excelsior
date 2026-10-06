import type { CatalogCard } from '../../../../frontend/src/lib/api/types';
import { resolveTournamentCard } from '../../../../frontend/src/lib/tournaments/resolveTournamentCard';

import {presentCatalog} from '../../../../src/services/catalog-presentation/presentCatalog';

function mockCard(name: string, id: string, extras: Partial<CatalogCard> = {}): CatalogCard {
  return { id, name, image_path: `characters/${id}.webp`, set: 'ERB', ...extras };
}

describe('resolveTournamentCard', () => {
  const catalog = [
    { card: mockCard('Sherlock Holmes', 'sherlock'), catalogType: 'characters' as const },
    { card: mockCard('221-B Baker St.', 'baker'), catalogType: 'locations' as const },
    { card: mockCard('Fairy Protection', 'fairy'), catalogType: 'special-cards' as const },
  ];

  it('resolves character by canonical name', () => {
    const hit = resolveTournamentCard(catalog, 'Sherlock Holmes', 'characters');
    expect(hit?.card.id).toBe('sherlock');
  });

  it('normalizes Excel alias Sherlock to Sherlock Holmes', () => {
    const hit = resolveTournamentCard(catalog, 'Sherlock', 'characters');
    expect(hit?.card.id).toBe('sherlock');
  });

  it('normalizes homebase alias without period', () => {
    const hit = resolveTournamentCard(catalog, '221-B Baker St', 'locations');
    expect(hit?.card.id).toBe('baker');
  });

  it('returns null when name is not in catalog', () => {
    expect(resolveTournamentCard(catalog, 'Unknown Hero', 'characters')).toBeNull();
  });

  it('opens default non-foil printing when foil row matches first', () => {
    const withFoil = [
      {
        card: mockCard('Wicked Witch', 'witch-foil', { is_foil: true, set_number: '042F' }),
        catalogType: 'characters' as const,
      },
      {
        card: mockCard('Wicked Witch', 'witch-base', { is_foil: false, set_number: '042' }),
        catalogType: 'characters' as const,
      },
    ];

    const presented=presentCatalog(withFoil.map(c=>c.card),'characters',[{foilCardId:'witch-foil',baseCardId:'witch-base',cardType:'character'}],[]) as CatalogCard[];
    const hit = resolveTournamentCard(withFoil.map((c,i)=>({...c,card:presented[i]})), 'Wicked Witch', 'characters', {
      foilLookup: {
        foilToBase: new Map([['witch-foil', 'witch-base']]),
        baseToFoil: new Map([['witch-base', 'witch-foil']]),
      },
    });

    expect(hit?.card.id).toBe('witch-base');
    expect(hit?.card.is_foil).not.toBe(true);
  });
});
