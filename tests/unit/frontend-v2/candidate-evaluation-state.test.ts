/** @jest-environment jsdom */
import { candidateInputKey, type CandidateEvaluationInput } from '../../../src/services/deck-candidates/inputKey';
import { useCandidateEvaluation } from '../../../frontend/src/lib/decks/useCandidateEvaluation';
import { evaluateCandidates } from '../../../frontend/src/lib/api/deckCandidates';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Same React runtime as the frontend hook.
const React: typeof import('../../../frontend/node_modules/@types/react') = require('../../../frontend/node_modules/react');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Same React runtime as the frontend hook.
const { createRoot }: typeof import('../../../frontend/node_modules/@types/react-dom/client') = require('../../../frontend/node_modules/react-dom/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Same Query runtime as the frontend hook.
const { QueryClient, QueryClientProvider }: typeof import('../../../frontend/node_modules/@tanstack/react-query') = require('../../../frontend/node_modules/@tanstack/react-query/build/modern/index.cjs');
jest.mock('../../../frontend/src/lib/api/deckCandidates', () => ({ evaluateCandidates: jest.fn() }));
const evaluate = jest.mocked(evaluateCandidates);
const input: CandidateEvaluationInput = { schemaVersion: 1, cards: [], candidates: [{ catalogType: 'power-cards', cardId: 'fictional-power' }] };
type Result = Awaited<ReturnType<typeof evaluateCandidates>>;
let client: InstanceType<typeof QueryClient>; let root: ReturnType<typeof createRoot>; let latest: ReturnType<typeof useCandidateEvaluation>;
function Harness({ value, enabled }: { value: CandidateEvaluationInput; enabled: boolean }) { latest = useCandidateEvaluation(value, enabled); return null; }
const render = async (value = input, enabled = true) => React.act(async () => root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness, { value, enabled }))));
const tick = async (ms = 1) => React.act(async () => { jest.advanceTimersByTime(ms); await Promise.resolve(); });
const result = (p: Parameters<typeof evaluateCandidates>[0]) => ({ schemaVersion: 1, revision: p.revision, inputKey: candidateInputKey(p), candidates: [] }) as unknown as Result;
describe('Exact-input candidate lifecycle', () => {
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; jest.useFakeTimers(); client = new QueryClient(); root = createRoot(document.createElement('div')); evaluate.mockReset(); });
  afterEach(async () => { await React.act(async () => root.unmount()); client.clear(); jest.useRealTimers(); });
  it('cancels superseded requests and cannot reuse old usable decisions for a changed team', async () => {
    let finish: (r: Result) => void = () => {}; let oldSignal: AbortSignal | undefined; let oldInput: Parameters<typeof evaluateCandidates>[0];
    evaluate.mockImplementationOnce((p, signal) => { oldInput = p; oldSignal = signal; return new Promise(r => { finish = r; }); });
    evaluate.mockImplementationOnce(async p => result(p));
    await render(); await tick();
    await render({ ...input, cards: [{ type: 'character', cardId: 'fictional-character', quantity: 1 }] }); await tick();
    expect(oldSignal?.aborted).toBe(true); const current = latest.result;
    await React.act(async () => finish(result(oldInput!))); await tick();
    expect(latest.result).toBe(current);
    await render(input, false); expect(latest.result).toBeUndefined();
  });
  it('withholds decisions while unavailable and recovers through explicit retry', async () => {
    evaluate.mockRejectedValue(new Error('offline')); await render(); await tick(1000); await tick(1001); await tick();
    expect(latest.error).toBe(true); expect(latest.result).toBeUndefined();
    evaluate.mockImplementation(async p => result(p)); await React.act(async () => latest.retry()); await tick();
    expect(latest.error).toBe(false); expect(latest.result).toBeDefined();
  });
  it('withholds stale transport revisions instead of treating them as fresh eligibility', async () => {
    evaluate.mockImplementation(async p => ({ ...result(p), revision: p.revision - 1 })); await render(); await tick();
    expect(latest.result).toBeUndefined(); expect(latest.pending).toBe(true);
  });
  it('requires a fresh request on reopening even when the draft and candidate IDs are unchanged', async () => {
    evaluate.mockImplementationOnce(async p => result(p));
    evaluate.mockImplementationOnce(() => new Promise(() => {}));
    await render(); await tick(); expect(latest.result).toBeDefined();
    await render(input, false); expect(latest.result).toBeUndefined();
    await render(input, true); expect(latest.result).toBeUndefined(); expect(latest.pending).toBe(true);
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

});
