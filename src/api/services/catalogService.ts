import { presentCatalog } from '../../services/catalog-presentation/presentCatalog';
import type { CatalogType, CatalogCard, FoilMapEntry } from '../../services/catalog-presentation/types';
import type { CardRepository } from '../../repository/CardRepository';
import type {
  CardErrataAssociation,
  CatalogErrataEntry,
} from '../../database/cardErrataRepository';

/**
 * Card repository surface used by the catalog service. Keeps HTTP layers from
 * depending on the full `CardRepository` while delegating reads to persistence.
 */
export type CatalogCardRepository = Pick<
  CardRepository,
  | 'getAllCharacters'
  | 'getAllLocations'
  | 'getAllBattlegrounds'
  | 'getAllSpecialCards'
  | 'getAllMissions'
  | 'getAllEvents'
  | 'getAllAspects'
  | 'getAllAdvancedUniverse'
  | 'getAllTeamwork'
  | 'getAllAllyUniverse'
  | 'getAllTraining'
  | 'getAllBasicUniverse'
  | 'getAllPowerCards'
  | 'getCardStats'
>;

export interface FoilCardMapReader {
  getFoilCardMap(): Promise<unknown[]>;
}

export interface CardErrataReader {
  getAllCardErrata(): Promise<CardErrataAssociation[]>;
}

type CatalogRow = Record<string, unknown> & { id?: unknown };

/**
 * Read-only card catalog for DBV / legacy `/api/*` catalog GETs / v1.
 * HTTP handlers call this service only; the service calls repositories.
 */
export class CatalogService {
  constructor(
    private readonly cards: CatalogCardRepository,
    private readonly foilMap: FoilCardMapReader,
    private readonly cardErrata?: CardErrataReader
  ) {}

  private async withErrata(
    cardType: string,
    loadCards: () => Promise<unknown[]>
  ): Promise<unknown[]> {
    if (!this.cardErrata) return loadCards();

    const [cards, associations] = await Promise.all([
      loadCards(),
      this.cardErrata.getAllCardErrata()
    ]);
    const errataByCardId = new Map<string, CatalogErrataEntry[]>();

    for (const association of associations) {
      if (association.card_type !== cardType) continue;
      const { card_type: _cardType, card_id: cardId, ...entry } = association;
      const linkedEntries = errataByCardId.get(cardId) ?? [];
      linkedEntries.push(entry);
      errataByCardId.set(cardId, linkedEntries);
    }
    for (const linkedEntries of errataByCardId.values()) {
      linkedEntries.sort((a, b) => a.source_section - b.source_section || a.id.localeCompare(b.id));
    }

    return cards.map((card) => {
      if (!card || typeof card !== 'object') return card;
      const row = card as CatalogRow;
      const linkedEntries = typeof row.id === 'string'
        ? errataByCardId.get(row.id)
        : undefined;
      return linkedEntries?.length ? { ...row, errata: linkedEntries } : row;
    });
  }

  getAllCharacters(): Promise<unknown[]> {
    return this.withErrata('character', () => this.cards.getAllCharacters());
  }

  getAllLocations(): Promise<unknown[]> {
    return this.withErrata('location', () => this.cards.getAllLocations());
  }

  getAllBattlegrounds(): Promise<unknown[]> {
    return this.withErrata('battleground', () => this.cards.getAllBattlegrounds());
  }

  getAllSpecialCards(): Promise<unknown[]> {
    return this.withErrata('special', () => this.cards.getAllSpecialCards());
  }

  getAllMissions(): Promise<unknown[]> {
    return this.withErrata('mission', () => this.cards.getAllMissions());
  }

  getAllEvents(): Promise<unknown[]> {
    return this.withErrata('event', () => this.cards.getAllEvents());
  }

  getAllAspects(): Promise<unknown[]> {
    return this.withErrata('aspect', () => this.cards.getAllAspects());
  }

  getAllAdvancedUniverse(): Promise<unknown[]> {
    return this.withErrata('advanced_universe', () => this.cards.getAllAdvancedUniverse());
  }

  getAllTeamwork(): Promise<unknown[]> {
    return this.withErrata('teamwork', () => this.cards.getAllTeamwork());
  }

  getAllAllyUniverse(): Promise<unknown[]> {
    return this.withErrata('ally_universe', () => this.cards.getAllAllyUniverse());
  }

  getAllTraining(): Promise<unknown[]> {
    return this.withErrata('training', () => this.cards.getAllTraining());
  }

  getAllBasicUniverse(): Promise<unknown[]> {
    return this.withErrata('basic_universe', () => this.cards.getAllBasicUniverse());
  }

  getAllPowerCards(): Promise<unknown[]> {
    return this.withErrata('power', () => this.cards.getAllPowerCards());
  }

  getFoilCardMap(): Promise<unknown[]> {
    return this.foilMap.getFoilCardMap();
  }

  async getPresentation(type: CatalogType) {
    const loaders: Record<CatalogType, () => Promise<unknown[]>> = {
      characters: () => this.getAllCharacters(), 'special-cards': () => this.getAllSpecialCards(),
      'power-cards': () => this.getAllPowerCards(), locations: () => this.getAllLocations(),
      battlegrounds: () => this.getAllBattlegrounds(), missions: () => this.getAllMissions(),
      events: () => this.getAllEvents(), aspects: () => this.getAllAspects(),
      'advanced-universe': () => this.getAllAdvancedUniverse(), teamwork: () => this.getAllTeamwork(),
      'ally-universe': () => this.getAllAllyUniverse(), training: () => this.getAllTraining(),
      'basic-universe': () => this.getAllBasicUniverse(),
    };
    const [rows, foilEntries, characters] = await Promise.all([
      loaders[type](), this.getFoilCardMap(),
      type === 'special-cards' || type === 'advanced-universe' ? this.getAllCharacters() : Promise.resolve([]),
    ]);
    return presentCatalog(rows as CatalogCard[], type, foilEntries as FoilMapEntry[], characters as CatalogCard[]);
  }

  getCardStats() {
    return this.cards.getCardStats();
  }
}
