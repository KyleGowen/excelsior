/**
 * GUEST collection store. Guest collections are never persisted server-side
 * (per product rules); they live in localStorage keyed by the current browser.
 * Shape is intentionally close to the server `CollectionCard` so the Collection
 * UI can treat guest + user data uniformly.
 */
import type { CollectionCardType } from '../api/types';

const STORAGE_KEY = 'guestCollection';

export interface GuestCollectionEntry {
  cardId: string;
  cardType: CollectionCardType;
  imagePath: string;
  quantity: number;
  cardName?: string;
  set?: string;
}

type GuestCollectionMap = Record<string, GuestCollectionEntry>;

function keyOf(cardType: string, cardId: string, imagePath: string): string {
  return `${cardType}::${cardId}::${imagePath}`;
}

function read(): GuestCollectionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as GuestCollectionMap) : {};
  } catch {
    return {};
  }
}

function write(map: GuestCollectionMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full / unavailable - ignore */
  }
  window.dispatchEvent(new CustomEvent('guest-collection-change'));
}

export function getGuestCollection(): GuestCollectionEntry[] {
  return Object.values(read()).filter((e) => e.quantity > 0);
}

export function getGuestQuantity(cardType: string, cardId: string, imagePath: string): number {
  const map = read();
  return map[keyOf(cardType, cardId, imagePath)]?.quantity ?? 0;
}

export function setGuestQuantity(entry: GuestCollectionEntry): void {
  const map = read();
  const key = keyOf(entry.cardType, entry.cardId, entry.imagePath);
  if (entry.quantity <= 0) {
    delete map[key];
  } else {
    map[key] = { ...entry };
  }
  write(map);
}

export function adjustGuestQuantity(entry: Omit<GuestCollectionEntry, 'quantity'>, delta: number): number {
  const current = getGuestQuantity(entry.cardType, entry.cardId, entry.imagePath);
  const next = Math.max(0, current + delta);
  setGuestQuantity({ ...entry, quantity: next });
  return next;
}
