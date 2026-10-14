import { createHash } from 'crypto';
import type { CatalogCard } from '../catalog-presentation/types';
import { buildAvailableCardsMap, type DeckCatalogBundle } from './build-available-cards-map';

type Catalog = Map<string, Record<string, unknown>>;
type Artifacts = { version: string; preview: Map<string, CatalogCard> };
// Only snapshots made here are memoized. Caller-supplied/mutable maps are
// rebuilt on use, including test doubles and independently supplied catalogs.
const artifacts = new WeakMap<Catalog, Artifacts>();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function freezeValue<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeValue(child);
    Object.freeze(value);
  }
  return value;
}

function lockMap<T>(map: Map<string, T>): Map<string, T> {
  const immutable = () => { throw new TypeError('Catalog snapshots are read-only'); };
  Object.defineProperties(map, {
    set: { value: immutable }, delete: { value: immutable }, clear: { value: immutable },
  });
  return Object.freeze(map);
}

function buildArtifacts(catalog: Catalog): Artifacts {
  const preview = new Map([...catalog].map(([key, card]) => {
    const type = key.slice(0, -String(card.id).length - 1).replace(/_/g, '-');
    return [`${type}:${card.id}`, { ...card, id: String(card.id),
      type: type === 'basic-universe' ? card.basic_skill_type ?? card.type : card.type ?? type,
    } as CatalogCard] as const;
  }));
  return { version: hash(JSON.stringify([...catalog])), preview };
}

export function deckCatalogArtifacts(catalog: Catalog): Artifacts {
  return artifacts.get(catalog) ?? buildArtifacts(catalog);
}

/** One current content snapshot per validator; repository freshness is unchanged. */
export class DeckCatalogSnapshotCache {
  private current?: { content: string; catalog: Catalog };

  resolve(bundle: DeckCatalogBundle): Catalog {
    const serialized = JSON.stringify(bundle);
    const content = hash(serialized);
    if (this.current?.content === content) return this.current.catalog;
    // JSON is the versioned catalog's representation. Detach nested values from
    // mutable repository rows, retaining the same serialized dates/versions.
    const catalog = buildAvailableCardsMap(JSON.parse(serialized) as DeckCatalogBundle);
    for (const row of catalog.values()) freezeValue(row);
    const derived = buildArtifacts(catalog);
    for (const row of derived.preview.values()) freezeValue(row);
    lockMap(derived.preview);
    lockMap(catalog);
    artifacts.set(catalog, derived);
    this.current = { content, catalog };
    return catalog;
  }
}
