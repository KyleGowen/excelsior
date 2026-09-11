import type { Deck, PreconstructedDeckRecord, User } from '../../types';
import { transformDeckListItem } from '../deckTransform';
import { resolveUserDisplayName } from '../../utils/resolveUserDisplayName';
import type { PreconstructedDeckGroupV1DataDto } from '../dto/v1/PreconstructedDeckGroupV1DataDto';

/** Deck reads/writes needed by the community + favorites + public-profile features. */
export interface CommunityDeckRepository {
  getCommunityFeedDecks(opts?: { limit?: number; excludeUserIds?: string[] }): Promise<Deck[]>;
  searchCommunityDecks(opts: {
    search: string;
    limit?: number;
    excludeUserIds?: string[];
  }): Promise<Deck[]>;
  getPublicDecksByUserId(userId: string): Promise<Deck[]>;
  getPublicDecksByIds(ids: string[]): Promise<Deck[]>;
  getPreconstructedDecks(): Promise<PreconstructedDeckRecord[]>;
  getFavoriteDecksForUser(userId: string): Promise<Deck[]>;
  getDeckById(id: string): Promise<Deck | undefined>;
  addDeckFavorite(userId: string, deckId: string): Promise<boolean>;
  removeDeckFavorite(userId: string, deckId: string): Promise<boolean>;
  getFavoritedDeckIds(userId: string, deckIds: string[]): Promise<Set<string>>;
}

export interface CommunityUserLookup {
  getUsersByIds(ids: string[]): Promise<User[]>;
}

export type EnrichedDeckListItem = ReturnType<typeof transformDeckListItem> & {
  metadata: ReturnType<typeof transformDeckListItem>['metadata'] & {
    ownerDisplayName: string | null;
    isFavorited: boolean;
  };
};

type Fail = { ok: false; status: number; code: string; message: string };
type Ok<T> = { ok: true; status: number; data: T };

function fail(status: number, code: string, message: string): Fail {
  return { ok: false, status, code, message };
}
function ok<T>(status: number, data: T): Ok<T> {
  return { ok: true, status, data };
}

export type FavoriteToggleResult = Ok<{ deckId: string; isFavorited: boolean }> | Fail;

const SKYBOUND_FEATURED_UPGRADE_PRODUCTION_DECK_IDS = [
  '63a92f20-1e50-47ab-b7e6-84574370b666',
  'b955e265-bff1-4869-8e15-a4b72c280213',
  '32734448-f027-4898-b682-c925c2c2ff49',
  '7434ab13-993c-46e0-8bd1-79a12a8dfe4b',
] as const;

const SKYBOUND_FEATURED_UPGRADE_DEVELOPMENT_DECK_IDS = [
  '89f33651-e5c5-4c99-8c8b-80696009e8be',
  '2e96e432-9e90-4060-965b-ec7b1dda31ec',
  '821bb838-d28c-4a58-956a-d9cf01c8f581',
  'acb4df16-2d69-44da-a6ab-caed5db1b88d',
] as const;

function getSkyboundFeaturedUpgradeDeckIds(): readonly string[] {
  return process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
    ? SKYBOUND_FEATURED_UPGRADE_PRODUCTION_DECK_IDS
    : SKYBOUND_FEATURED_UPGRADE_DEVELOPMENT_DECK_IDS;
}

/**
 * Community decks, favorites, and read-only public profiles. Enriches deck list
 * items with the owner's resolved display name and the viewer's favorite state.
 */
export class CommunityService {
  constructor(
    private readonly deckRepository: CommunityDeckRepository,
    private readonly userLookup: CommunityUserLookup,
    /** Internal/curated accounts excluded from the community feed + search. */
    private readonly excludeUserIds: string[] = []
  ) {}

  private async enrich(
    decks: Deck[],
    viewerUserId: string | null
  ): Promise<EnrichedDeckListItem[]> {
    const ownerIds = Array.from(new Set(decks.map((d) => d.user_id)));
    const owners = await this.userLookup.getUsersByIds(ownerIds);
    const nameById = new Map(owners.map((u) => [u.id, resolveUserDisplayName(u)]));
    const favSet = viewerUserId
      ? await this.deckRepository.getFavoritedDeckIds(
          viewerUserId,
          decks.map((d) => d.id)
        )
      : new Set<string>();

    return decks.map((deck) => {
      const item = transformDeckListItem(deck, viewerUserId ?? undefined);
      return {
        ...item,
        metadata: {
          ...item.metadata,
          ownerDisplayName: nameById.get(deck.user_id) ?? null,
          isFavorited: favSet.has(deck.id),
        },
      };
    });
  }

  /** Community feed (no search → 20 most-recent; with search → deck, owner, or card-name match). */
  async getCommunityDecks(
    viewerUserId: string | null,
    search?: string
  ): Promise<EnrichedDeckListItem[]> {
    const trimmed = (search ?? '').trim();
    const decks = trimmed
      ? await this.deckRepository.searchCommunityDecks({
          search: trimmed,
          excludeUserIds: this.excludeUserIds,
        })
      : await this.deckRepository.getCommunityFeedDecks({
          limit: 20,
          excludeUserIds: this.excludeUserIds,
        });
    return this.enrich(decks, viewerUserId);
  }

  /** Public decks owned by a user (read-only public profile). */
  async getPublicDecksForUser(
    targetUserId: string,
    viewerUserId: string | null
  ): Promise<EnrichedDeckListItem[]> {
    const decks = await this.deckRepository.getPublicDecksByUserId(targetUserId);
    return this.enrich(decks, viewerUserId);
  }

  /** Official preconstructed decks grouped by release set, newest release first. */
  async getPreconstructedDeckGroups(
    viewerUserId: string | null
  ): Promise<PreconstructedDeckGroupV1DataDto[]> {
    const featuredUpgradeDeckIds = getSkyboundFeaturedUpgradeDeckIds();
    const [records, featuredUpgradeDecks] = await Promise.all([
      this.deckRepository.getPreconstructedDecks(),
      this.deckRepository.getPublicDecksByIds([...featuredUpgradeDeckIds]),
    ]);
    const sorted = [...records].sort(
      (a, b) => b.releaseOrder - a.releaseOrder || a.deckOrder - b.deckOrder
    );
    const enriched = await this.enrich(
      [...sorted.map((record) => record.deck), ...featuredUpgradeDecks],
      viewerUserId
    );
    const enrichedById = new Map(enriched.map((deck) => [deck.metadata.id, deck]));
    const groups = new Map<string, PreconstructedDeckGroupV1DataDto>();

    for (const record of sorted) {
      let group = groups.get(record.setCode);
      if (!group) {
        group = {
          setCode: record.setCode,
          setName: record.setLabel,
          decks: [],
          featuredUpgradeRecommendations: [],
        };
        groups.set(record.setCode, group);
      }
      const deck = enrichedById.get(record.deck.id);
      if (deck) group.decks.push(deck);
    }

    const skyboundGroup = groups.get('SKY');
    if (skyboundGroup) {
      skyboundGroup.featuredUpgradeRecommendations = featuredUpgradeDeckIds.flatMap(
        (deckId) => {
          const deck = enrichedById.get(deckId);
          return deck ? [deck] : [];
        }
      );
    }

    return Array.from(groups.values());
  }

  /** The viewer's own favorited decks. */
  async getFavorites(viewerUserId: string): Promise<EnrichedDeckListItem[]> {
    const decks = await this.deckRepository.getFavoriteDecksForUser(viewerUserId);
    return this.enrich(decks, viewerUserId);
  }

  async addFavorite(viewerUserId: string, deckId: string): Promise<FavoriteToggleResult> {
    const deck = await this.deckRepository.getDeckById(deckId);
    if (!deck) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    if (deck.user_id === viewerUserId) {
      return fail(400, 'CANNOT_FAVORITE_OWN', 'You cannot favorite your own deck');
    }
    await this.deckRepository.addDeckFavorite(viewerUserId, deckId);
    return ok(200, { deckId, isFavorited: true });
  }

  async removeFavorite(viewerUserId: string, deckId: string): Promise<FavoriteToggleResult> {
    await this.deckRepository.removeDeckFavorite(viewerUserId, deckId);
    return ok(200, { deckId, isFavorited: false });
  }
}
