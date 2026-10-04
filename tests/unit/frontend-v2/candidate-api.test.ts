import { evaluateCandidates } from '../../../frontend/src/lib/api/deckCandidates';
import { apiRequest } from '../../../frontend/src/lib/api/client';
import { candidateInputKey } from '../../../src/services/deck-candidates/inputKey';
jest.mock('../../../frontend/src/lib/api/client', () => ({ apiRequest: jest.fn() }));
const request = jest.mocked(apiRequest);
const input = { schemaVersion: 1 as const, revision: 7, cards: [], candidates: [{ catalogType: 'power-cards', cardId: 'fictional-power' }] };
const response = () => ({ inputKey: candidateInputKey(input), revision: 7, candidates: [{ ...input.candidates[0], usable: true, maxCopies: 99, reasons: [] }] });
describe('Candidate API exact input guard', () => {
  beforeEach(() => request.mockReset());
  it('passes abort signal and unwraps the shared server decision contract', async () => { const signal = new AbortController().signal; request.mockResolvedValue(response()); await evaluateCandidates(input, signal); expect(request).toHaveBeenCalledWith('/api/v1/decks/candidates/evaluate', expect.objectContaining({ signal, body: input, method: 'POST' })); });
  it.each(['revision', 'key', 'identity'])('rejects mismatched %s', async kind => { const r = response(); if (kind === 'revision') r.revision = 6; if (kind === 'key') r.inputKey = 'old'; if (kind === 'identity') r.candidates[0].cardId = 'other'; request.mockResolvedValue(r); await expect(evaluateCandidates(input)).rejects.toThrow('match'); });
});
