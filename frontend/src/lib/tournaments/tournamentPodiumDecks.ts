import type { DeckListItem } from '../api/types';
import {
  type TournamentDeckPlacement,
  type TournamentPodiumResult,
} from './types';

export interface TournamentPodiumDeckEntry extends TournamentPodiumResult {
  deck: DeckListItem | null;
  deckId: string | null;
  userId: string | null;
}

export interface TournamentPodiumDeckOptions {
  deckNameLabel: string;
  deckTitleSeries?: string;
  podium: TournamentPodiumResult[];
  stableDeckIds?: Partial<Record<TournamentDeckPlacement, string>>;
  stableDeckUserId?: string;
}

function findDeckByNamePrefix(
  decks: DeckListItem[],
  deckNameLabel: string,
  placement: TournamentDeckPlacement,
  deckTitleSeries = 'S1 Regionals',
): DeckListItem | undefined {
  const prefix = `${deckTitleSeries} (${deckNameLabel} ${placement}`.toLowerCase();
  return decks.find((deck) => deck.metadata.name.toLowerCase().startsWith(prefix));
}

/** Resolve podium decks by stable ID when available, then by the shared title convention. */
export function resolveTournamentPodiumDecks(
  decks: DeckListItem[],
  options: TournamentPodiumDeckOptions,
): TournamentPodiumDeckEntry[] {
  return options.podium.map((result) => {
    const placement = result.placement;
    const stableId = options.stableDeckIds?.[placement];
    const deck =
      (stableId ? decks.find((entry) => entry.metadata.id === stableId) : undefined) ??
      findDeckByNamePrefix(
        decks,
        options.deckNameLabel,
        placement,
        options.deckTitleSeries,
      ) ??
      null;

    return {
      placement,
      playerName: result.playerName,
      deck,
      deckId: deck?.metadata.id ?? stableId ?? null,
      userId: deck?.metadata.userId ?? (stableId ? options.stableDeckUserId ?? null : null),
    };
  });
}

/** Extract the player name from a conventionally named tournament deck. */
export function extractTournamentPodiumPlayerName(
  deckName: string,
  placement: TournamentDeckPlacement,
  deckNameLabel: string,
): string {
  const escapedLabel = deckNameLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = deckName.match(new RegExp(`${escapedLabel}\\s+${placement},\\s*(.+?)\\)?$`, 'i'));
  return match?.[1]?.trim() || deckName;
}
