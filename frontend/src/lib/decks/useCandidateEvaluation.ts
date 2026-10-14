import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { candidateInputKey, type CandidateEvaluationInput } from '../../contracts/inputKey';
import { evaluateCandidates } from '../api/deckCandidates';
export function useCandidateEvaluation(input: CandidateEvaluationInput, enabled: boolean) {
  const hostOperation = useOptionalModuleHost()?.api.evaluateCandidates ?? evaluateCandidates;
  const key = candidateInputKey(input);
  const revision = useRef(0);
  const payload = useMemo(() => ({ ...JSON.parse(key) as CandidateEvaluationInput, revision: ++revision.current }), [key, enabled]);
  const query = useQuery({ queryKey: ['candidate-evaluation', key, payload.revision], queryFn: ({ signal }) => hostOperation(payload, signal), enabled, retry: 1, staleTime: 0, gcTime: 0 });
  const result = enabled && query.data?.inputKey === key && query.data?.revision === payload.revision ? query.data : undefined;
  // Keep the same catalog visible during a draft refresh. Only result may
  // authorize additions; the previous response is presentation data only.
  const catalogKey = candidateInputKey({ ...input, cards: [] });
  const settled = useRef<{ catalogKey: string; result: NonNullable<typeof result> } | undefined>(undefined);
  useEffect(() => {
    if (!enabled || settled.current?.catalogKey !== catalogKey) settled.current = undefined;
    if (result) settled.current = { catalogKey, result };
  }, [enabled, catalogKey, result]);
  const displayResult = enabled
    ? result ?? (settled.current?.catalogKey === catalogKey ? settled.current.result : undefined)
    : undefined;
  return { result, displayResult, pending: enabled && !result && !query.isError, error: enabled && !result && query.isError, retry: () => { void query.refetch(); } };
}
