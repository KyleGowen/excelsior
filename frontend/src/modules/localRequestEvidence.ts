/** Development fixture observations only: no bodies, headers, credentials or player IDs. */
export type LocalRequestMode = 'online' | 'slow-collection' | 'offline-collection';
interface Observation { operation: string; status: number; durationMs: number; decodedBytes: number; outcome: 'response' | 'cancelled' | 'failed' }
export function createLocalRequestEvidence(fetcher: typeof fetch = fetch) {
  const listeners = new Set<() => void>();
  let snapshot: { mode: LocalRequestMode; requests: Observation[] } = { mode: 'online', requests: [] };
  const notify = () => { for (const listener of listeners) listener(); };
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
  const getSnapshot = () => snapshot;
  const setMode = (mode: LocalRequestMode) => { snapshot = { ...snapshot, mode }; notify(); };
  const observe = (entry: Observation) => { snapshot = { ...snapshot, requests: [...snapshot.requests, entry].slice(-250) }; notify(); };
  const wrapped: typeof fetch = async (input, init) => {
    const pathname = new URL(String(input), window.location.origin).pathname;
    const operation = (init?.method ?? 'GET') + ' ' + pathname.replace(/guest_[A-Za-z0-9_]+/g, '[guest-fixture]').replace(/[a-f0-9]{8}-[a-f0-9-]{27}/g, '[fixture]');
    const started = performance.now();
    const collection = /\/api\/v1\/collections\/(?:evaluate|me\/view)$/.test(pathname);
    try {
      if (collection && snapshot.mode === 'offline-collection') throw new TypeError('Fictional local collection outage');
      if (collection && snapshot.mode === 'slow-collection') {
        await new Promise<void>((resolve, reject) => {
          const abort = () => { clearTimeout(timer); init?.signal?.removeEventListener('abort', abort); reject(new DOMException('Aborted', 'AbortError')); };
          const timer = setTimeout(() => { init?.signal?.removeEventListener('abort', abort); resolve(); }, 750);
          if (init?.signal?.aborted) abort(); else init?.signal?.addEventListener('abort', abort, { once: true });
        });
      }
      const response = await fetcher(input, init);
      const bytes = (await response.clone().arrayBuffer()).byteLength;
      observe({ operation, status: response.status, durationMs: performance.now() - started, decodedBytes: bytes, outcome:'response' });
      return response;
    } catch (error) {
      observe({ operation, status: 0, durationMs: performance.now() - started, decodedBytes: 0, outcome:error instanceof Error && error.name==='AbortError' ? 'cancelled' : 'failed' });
      throw error;
    }
  };
  return { subscribe, getSnapshot, setMode, fetcher: wrapped };
}
export type LocalRequestEvidence = ReturnType<typeof createLocalRequestEvidence>;
export const noRequestEvidence = () => null;
export const noRequestSubscription = (_listener: () => void) => () => {};
