import { apiRequest as defaultApiRequest } from './client';

import { candidateInputKey, type CandidateEvaluationInput } from '../../contracts/inputKey';

import type { DeckCandidatesEvaluationDto } from '../../contracts/DeckCandidatesEvaluationDto';

/** Bind these existing operations to one host's transport; no global client mutation. */
export function createCandidateApi(apiRequest: typeof defaultApiRequest = defaultApiRequest) {

async function evaluateCandidates(input: CandidateEvaluationInput & { revision: number }, signal?: AbortSignal): Promise<DeckCandidatesEvaluationDto> {
  const result = await apiRequest<DeckCandidatesEvaluationDto>('/api/v1/decks/candidates/evaluate', { method: 'POST', body: input, ...(signal ? { signal } : {}) });
  if (result.inputKey !== candidateInputKey(input) || result.revision !== input.revision) throw new Error('Candidate evaluation does not match the current draft');
  if (result.candidates.length !== input.candidates.length || result.candidates.some((c, i) => c.cardId !== input.candidates[i]?.cardId || c.catalogType !== input.candidates[i]?.catalogType)) throw new Error('Candidate identities do not match the requested catalog');
  return result;
}
return { evaluateCandidates };
}

export const { evaluateCandidates } = createCandidateApi();
