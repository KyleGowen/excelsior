import type { CatalogCard } from '../api/types';
import { cardDisplayName, cardMatchesSearchQuery } from './catalogTypeMap';
import type { StackCardEntry } from './characterStacks';
import { compareAlphabetically } from '../sort/alphabetical';

export const ADD_CARDS_MISSION_SETS_PAGE_SIZE = 4;

export const UNKNOWN_MISSION_SET = 'Unknown Mission Set';

export interface MissionSet {
  missionSetName: string;
  missions: CatalogCard[];
}

export function missionSetKey(card: CatalogCard): string {
  const name = String(card.mission_set ?? '').trim();
  return name || UNKNOWN_MISSION_SET;
}

function parseSetNumber(card: CatalogCard): number {
  const raw = String(card.set_number ?? '').trim();
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

export function compareMissionsWithinSet(a: CatalogCard, b: CatalogCard): number {
  const numCmp = parseSetNumber(a) - parseSetNumber(b);
  if (numCmp !== 0) return numCmp;
  return compareAlphabetically(cardDisplayName(a), cardDisplayName(b));
}

export function buildMissionSets(cards: CatalogCard[]): MissionSet[] {
  const bySet = new Map<string, CatalogCard[]>();

  for (const card of cards) {
    const key = missionSetKey(card);
    const list = bySet.get(key) ?? [];
    list.push(card);
    bySet.set(key, list);
  }

  const sets: MissionSet[] = [];
  for (const [missionSetName, missions] of bySet) {
    missions.sort(compareMissionsWithinSet);
    sets.push({ missionSetName, missions });
  }

  sets.sort((a, b) => compareAlphabetically(a.missionSetName, b.missionSetName));
  return sets;
}

export function missionSetCardsInAddOrder(set: MissionSet): StackCardEntry[] {
  return set.missions.map((card) => ({ catalogType: 'missions', card }));
}

function missionMatchesSearch(card: CatalogCard, query: string): boolean {
  if (cardMatchesSearchQuery(card, query)) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return missionSetKey(card).toLowerCase().includes(q);
}

export function filterMissionSets(sets: MissionSet[], searchQuery: string): MissionSet[] {
  const q = searchQuery.trim();
  if (!q) return sets;

  return sets.filter((set) => {
    if (set.missionSetName.toLowerCase().includes(q.toLowerCase())) return true;
    return set.missions.some((card) => missionMatchesSearch(card, q));
  });
}

export function countDeckMissions(cards: { type: string; quantity: number }[]): number {
  return cards
    .filter((c) => c.type === 'mission')
    .reduce((total, c) => total + c.quantity, 0);
}
