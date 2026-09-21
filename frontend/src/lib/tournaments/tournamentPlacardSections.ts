import type { TournamentEventMeta } from './types';
import { formatEventLocation } from './formatEventLocation';

export interface TournamentPlacardSection {
  label: string;
  value: string;
  variant?: 'default' | 'accent';
  wrap?: boolean;
  href?: string;
}

function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function getTournamentPlacardSections(
  meta: TournamentEventMeta,
  showPodium: boolean,
  showWinnerWithPodium = false,
): TournamentPlacardSection[] {
  return [
    ...(meta.location
      ? [{
          label: 'Location',
          value: formatEventLocation(meta.location),
          wrap: true,
          ...(meta.location.mapUrl ? { href: meta.location.mapUrl } : {}),
        }]
      : []),
    {
      label: 'Date',
      value: formatEventDate(meta.date),
    },
    {
      label: 'Players',
      value: String(meta.playerCount),
    },
    ...(showPodium && !showWinnerWithPodium
      ? []
      : [
          {
            label: 'Winner Name',
            value: meta.winnerName,
            variant: 'accent' as const,
          },
        ]),
  ];
}
