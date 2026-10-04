import { apiRequest } from './client';
import { candidateInputKey, type CandidateEvaluationInput } from '../../../../src/services/deck-candidates/inputKey';
import type { DeckCandidatesEvaluationDto } from '../../../../src/api/dto/v1/DeckCandidatesEvaluationDto';
export async function evaluateCandidates(input: CandidateEvaluationInput & { revision: number }, signal?: AbortSignal): Promise<DeckCandidatesEvaluationDto> {
  const result = await apiRequest<DeckCandidatesEvaluationDto>('/api/v1/decks/candidates/evaluate', { method: 'POST', body: input, ...(signal ? { signal } : {}) });
  if (result.inputKey !== candidateInputKey(input) || result.revision !== input.revision) throw new Error('Candidate evaluation does not match the current draft');
  if (result.candidates.length !== input.candidates.length || result.candidates.some((c, i) => c.cardId !== input.candidates[i]?.cardId || c.catalogType !== input.candidates[i]?.catalogType)) throw new Error('Candidate identities do not match the requested catalog');
  return result;
}
