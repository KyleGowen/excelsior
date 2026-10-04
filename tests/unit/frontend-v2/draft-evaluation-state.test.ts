/** @jest-environment jsdom */
import { evaluationInputKey } from '../../../src/services/deck-evaluation/draftInput';
// Exercise the real hook with the already installed frontend React/Query runtimes.
import { useDraftEvaluation } from '../../../frontend/src/lib/decks/useDraftEvaluation';
import { evaluateDraft } from '../../../frontend/src/lib/api/decks';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Share the frontend runtime instance in root Jest.
const React: typeof import('../../../frontend/node_modules/@types/react') = require('../../../frontend/node_modules/react');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Share the frontend runtime instance in root Jest.
const { createRoot }: typeof import('../../../frontend/node_modules/@types/react-dom/client') = require('../../../frontend/node_modules/react-dom/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Share the frontend runtime instance in root Jest.
const { QueryClient, QueryClientProvider }: typeof import('../../../frontend/node_modules/@tanstack/react-query') = require('../../../frontend/node_modules/@tanstack/react-query/build/modern/index.cjs');
jest.mock('../../../frontend/src/lib/api/decks', () => ({ evaluateDraft: jest.fn() }));
const evaluate = jest.mocked(evaluateDraft);
const input = { schemaVersion: 1 as const, draftId: 'fictional', cards: [], reserveCharacterId: null, limited: false, format: 'venture' as const, koCharacterIds: [] };
type Result = Awaited<ReturnType<typeof evaluateDraft>>;
let client: InstanceType<typeof QueryClient>;
let root: ReturnType<typeof createRoot>;
let latest: ReturnType<typeof useDraftEvaluation>;
function Harness({ value, seed }: {
    value: typeof input; seed?: Result;
}) { latest = useDraftEvaluation(value, true, seed); return null; }
async function render(value = input, seed?: Result) { await React.act(async () => root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness, { value, ...(seed ? { seed } : {}) })))); }
const tick = async (ms = 1000) => { await React.act(async () => { jest.advanceTimersByTime(ms); await Promise.resolve(); }); };
describe('Draft evaluation lifecycle', () => {
    beforeEach(() => { (globalThis as {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
    }).IS_REACT_ACT_ENVIRONMENT = true; jest.useFakeTimers(); client = new QueryClient(); root = createRoot(document.createElement('div')); evaluate.mockReset(); });
    afterEach(async () => { await React.act(async () => root.unmount()); client.clear(); jest.useRealTimers(); });
    it('uses exact response stats immediately with no extra evaluation request', async () => {
        const seed = { draftId: input.draftId, revision: 0, inputKey: evaluationInputKey(input) } as Result;
        await render(input, seed);
        expect(latest.result).toBe(seed);
        expect(latest.pending).toBe(false);
        expect(evaluate).not.toHaveBeenCalled();
    });
    it('starts changed/unsaved evaluations immediately and rejects a mismatched response seed', async () => {
        evaluate.mockImplementation(async p => ({ draftId: p.draftId, revision: p.revision, inputKey: evaluationInputKey(p) } as Result));
        const seed = { draftId: input.draftId, revision: 0, inputKey: evaluationInputKey(input) } as Result;
        await render(input, seed);
        await render({ ...input, limited: true }, seed);
        expect(evaluate).toHaveBeenCalledTimes(1);
        await tick(1);
        expect(latest.result?.revision).toBeGreaterThan(0);
        expect(latest.result).not.toBe(seed);
        expect(input.cards).toEqual([]);
    });
    it('keeps the settled display while a changed draft is pending, then replaces it', async () => {
        const seed = { draftId: input.draftId, revision: 0, inputKey: evaluationInputKey(input), counts: { drawPile: 8 } } as Result;
        let finish: (v: Result) => void = () => {};
        let request: Parameters<typeof evaluateDraft>[0];
        evaluate.mockImplementationOnce(p => { request = p; return new Promise(r => { finish = r; }); });
        await render(input, seed);
        await render({ ...input, limited: true }, seed);
        expect(latest.pending).toBe(true);
        expect(latest.result).toBeUndefined();
        expect(latest.displayResult).toBe(seed);
        const updated = { ...seed, revision: request!.revision, inputKey: evaluationInputKey(request!), counts: { drawPile: 7 } } as Result;
        await React.act(async () => finish(updated));
        await tick(1);
        expect(latest.displayResult).toBe(updated);
        expect(latest.result).toBe(updated);
    });
    it('never carries displayed stats into a different deck', async () => {
        const seed = { draftId: input.draftId, revision: 0, inputKey: evaluationInputKey(input) } as Result;
        evaluate.mockImplementation(() => new Promise(() => {}));
        await render(input, seed);
        await render({ ...input, draftId: 'another-fictional-deck' });
        expect(latest.pending).toBe(true);
        expect(latest.result).toBeUndefined();
        expect(latest.displayResult).toBeUndefined();
        await render(input);
        expect(latest.displayResult).toBeUndefined();
    });
    it('retains previous totals on failure while withholding current legality and allowing retry', async () => {
        const seed = { draftId: input.draftId, revision: 0, inputKey: evaluationInputKey(input) } as Result;
        evaluate.mockRejectedValue(new Error('offline'));
        await render(input, seed);
        await render({ ...input, limited: true });
        await tick(); await tick(1001); await tick(1);
        expect(latest.error).toBe(true);
        expect(latest.displayResult).toBe(seed);
        expect(latest.result).toBeUndefined();
        evaluate.mockImplementation(async p => ({ draftId: p.draftId, revision: p.revision, inputKey: evaluationInputKey(p) } as Result));
        await React.act(async () => latest.retry()); await tick(1);
        expect(latest.error).toBe(false);
        expect(latest.displayResult).toBe(latest.result);
        expect(latest.displayResult).not.toBe(seed);
    });
    it('ignores a late preview once a matching saved response arrives', async () => {
        let finish: (v: Result) => void = () => {};
        let request: Parameters<typeof evaluateDraft>[0];
        evaluate.mockImplementationOnce(p => { request = p; return new Promise(r => { finish = r; }); });
        await render();
        const seed = { draftId: input.draftId, revision: 0, inputKey: evaluationInputKey(input) } as Result;
        await render(input, seed);
        await React.act(async () => finish({ ...seed, revision: request.revision }));
        await tick(1);
        expect(latest.result).toBe(seed);
    });
    it('aborts superseded requests and prevents a late old response from replacing the new revision', async () => {
        let resolveOld: (v: Result) => void = () => { };
        let oldSignal: AbortSignal | undefined;
        evaluate.mockImplementationOnce((_p, signal) => { oldSignal = signal; return new Promise(resolve => { resolveOld = resolve; }); });
        evaluate.mockImplementationOnce(async (p) => ({ draftId: p.draftId, revision: p.revision, inputKey: evaluationInputKey(p) } as Result));
        await render();
        await tick();
        await render({ ...input, limited: true });
        await tick(1);
        const newRevision = latest.result?.revision;
        expect(oldSignal?.aborted).toBe(true);
        await React.act(async () => resolveOld({ draftId: 'fictional', revision: 1, inputKey: evaluationInputKey(input) } as Result));
        await tick(1);
        expect(latest.result?.revision).toBe(newRevision);
        expect(latest.displayResult?.revision).toBe(newRevision);
    });
    it('retains the draft and exposes retry after unavailable evaluation rather than a legal result', async () => {
        evaluate.mockRejectedValue(new Error('offline'));
        await render();
        await tick();
        await tick(1001);
        await tick(1);
        expect(latest.error).toBe(true);
        expect(latest.result).toBeUndefined();
        expect(input.cards).toEqual([]);
        evaluate.mockImplementation(async (p) => ({ draftId: p.draftId, revision: p.revision, inputKey: evaluationInputKey(p) } as Result));
        await React.act(async () => latest.retry());
        await tick(1);
        expect(latest.result).toBeDefined();
    });
});
