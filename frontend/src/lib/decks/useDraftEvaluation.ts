import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { evaluateDraft, type DraftEvaluationInput, type DraftEvaluation } from '../api/decks';
import { evaluationInputKey } from '../../../../src/services/deck-evaluation/draftInput';
/** Exact-input results control actions; the last settled display stays in place during refresh. */
export function useDraftEvaluation(input: Omit<DraftEvaluationInput, 'revision'>, enabled: boolean, seed?: DraftEvaluation | null) {
  const hostOperation = useOptionalModuleHost()?.api.evaluateDraft ?? evaluateDraft;
    const key = evaluationInputKey(input);
    const revision = useRef(0);
    const payload = useMemo(() => ({ ...JSON.parse(key) as Omit<DraftEvaluationInput, 'revision'>, revision: ++revision.current }), [key]);
    const matchingSeed = seed?.draftId === input.draftId && seed.inputKey === key ? seed : undefined;
    const query = useQuery({
        queryKey: ['draft-evaluation', input.draftId, payload.revision, key],
        queryFn: ({ signal }) => hostOperation(payload, signal),
        enabled: enabled && !matchingSeed,
        staleTime: 0,
        gcTime: 0,
        retry: 1,
    });
    const result = enabled ? matchingSeed ?? (query.data?.inputKey === key && query.data?.revision === payload.revision ? query.data : undefined) : undefined;
    // Presentation continuity only: never use the previous display for current legality/actions.
    // Store committed successful results, scoped to this deck, rather than caching evaluations.
    const settled = useRef<{ draftId: string; result: DraftEvaluation } | undefined>(undefined);
    useEffect(() => {
        if (!enabled || settled.current?.draftId !== input.draftId) settled.current = undefined;
        if (result) settled.current = { draftId: input.draftId, result };
    }, [enabled, input.draftId, result]);
    const displayResult = enabled ? result ?? (settled.current?.draftId === input.draftId ? settled.current.result : undefined) : undefined;
    return { result, displayResult, pending: enabled && !result && !query.isError, error: enabled && !result && query.isError, retry: () => { void query.refetch(); } };
}
