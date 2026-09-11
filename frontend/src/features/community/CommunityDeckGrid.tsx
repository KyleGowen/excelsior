import { useMemo } from 'react';
import { DeckTile } from '../../components/DeckTile';
import { buildCharStatsById, deckMaxStats } from '../../lib/decks/deckMaxStats';
import {
  buildDeckPreviewCatalogImages,
  enrichDeckListPreviewImages,
} from '../../lib/decks/deckPreviewImages';
import { buildMissionSetByCardId, deckMissionSetName } from '../../lib/decks/missionSetLabel';
import type { CatalogCard, DeckListItem } from '../../lib/api/types';

export interface CommunityDeckGridProps {
  decks: DeckListItem[];
  characters: Array<Partial<CatalogCard> & { id: string }> | undefined;
  locations?: Array<Partial<CatalogCard> & { id: string }> | undefined;
  battlegrounds?: Array<Partial<CatalogCard> & { id: string }> | undefined;
  missions: Array<Partial<CatalogCard> & { id: string }> | undefined;
  /** Current viewer id (decks owned by the viewer never show a favorite heart). */
  viewerId: string | null;
  /** Whether the viewer may favorite (logged-in real user). */
  canFavorite: boolean;
  favoriteBusy?: boolean;
  /** When omitted, no heart is shown. */
  onToggleFavorite?: (deck: DeckListItem) => void;
  /** Force the heart filled (favorites section, where every tile is a favorite). */
  favoriteFilled?: boolean;
  onOpen: (deck: DeckListItem) => void;
  onOwnerClick: (deck: DeckListItem) => void;
  showOwner?: boolean;
  showUpdated?: boolean;
  showLegality?: boolean;
  className?: string;
}

/** Shared deck grid for the community feed, favorites, tournament, and public-profile lists. */
export function CommunityDeckGrid({
  decks,
  characters,
  locations,
  battlegrounds,
  missions,
  viewerId,
  canFavorite,
  favoriteBusy,
  onToggleFavorite,
  favoriteFilled,
  onOpen,
  onOwnerClick,
  showOwner = true,
  showUpdated = true,
  showLegality = true,
  className = 'community__grid',
}: CommunityDeckGridProps) {
  const charStatsById = useMemo(() => buildCharStatsById(characters), [characters]);
  const missionSetByCardId = useMemo(() => buildMissionSetByCardId(missions ?? []), [missions]);
  const previewCatalogImages = useMemo(
    () => buildDeckPreviewCatalogImages(characters, locations, battlegrounds),
    [characters, locations, battlegrounds],
  );
  const enrichedDecks = useMemo(
    () => enrichDeckListPreviewImages(decks, previewCatalogImages),
    [decks, previewCatalogImages],
  );

  return (
    <div className={className}>
      {enrichedDecks.map((deck) => {
        const isOwn = deck.metadata.userId === viewerId;
        const showFavorite = canFavorite && !isOwn && Boolean(onToggleFavorite);
        return (
          <DeckTile
            key={deck.metadata.id}
            deck={deck}
            variant="full"
            maxStats={deckMaxStats(deck, charStatsById)}
            missionSetName={deckMissionSetName(deck, missionSetByCardId)}
            ownerName={showOwner ? (deck.metadata.ownerDisplayName ?? null) : null}
            onOwnerClick={showOwner ? () => onOwnerClick(deck) : undefined}
            showUpdated={showUpdated}
            showLegality={showLegality}
            onOpen={() => onOpen(deck)}
            onToggleFavorite={showFavorite ? () => onToggleFavorite!(deck) : undefined}
            isFavorited={favoriteFilled ?? Boolean(deck.metadata.isFavorited)}
            favoriteBusy={favoriteBusy}
          />
        );
      })}
    </div>
  );
}
