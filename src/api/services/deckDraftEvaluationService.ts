import crypto from 'crypto';
import { evaluationInputKey } from '../../services/deck-evaluation/draftInput';
import type { DeckCard } from '../../types';
import type { DeckValidationService } from '../../services/deckValidationService';
import { deckCardMapKey, effectiveTeamCharacterStats, characterThreatValue } from '../../services/deck-validation/deck-validation-utils';
import { calculateDeckTotalThreat } from '../../services/deck-evaluation/deckThreat';
import { calculateDeckIconTotals } from '../../services/deck-evaluation/iconTotals';
import { countPlayableCards, countCardsInDeck, canDrawHand } from '../../services/deck-evaluation/deckCounts';
import type { EvaluateDraftInput } from '../http/models/decks/EvaluateDraftRequestBody';
import type { DeckDraftEvaluationDto, DeckMetricGrid } from '../dto/v1/DeckDraftEvaluationDto';
export class DraftStructureError extends Error {
}
type Validator = Pick<DeckValidationService, 'resolveCatalog' | 'validateResolvedDeck'>;
type CharacterGrid = {
    name: string;
    energy: number;
    combat: number;
    brute_force: number;
    intelligence: number;
};
const grid = (c: CharacterGrid): DeckMetricGrid => ({ energy: c.energy, combat: c.combat, bruteForce: c.brute_force, intelligence: c.intelligence });
function maximum(rows: CharacterGrid[]): DeckMetricGrid {
    return rows.reduce((acc, c) => ({ energy: Math.max(acc.energy, c.energy), combat: Math.max(acc.combat, c.combat), bruteForce: Math.max(acc.bruteForce, c.brute_force), intelligence: Math.max(acc.intelligence, c.intelligence) }), { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 });
}
/** Stateless: no player/deck lookup, persistence, session changes, or client catalog fields. */
export class DeckDraftEvaluationService {
    constructor(private readonly validator: Validator) { }
    /** Evaluate a private snapshot of the response, never a second deck lookup or a cached result.
     * Unavailable/retired catalog data leaves the editable deck readable, with no fresh validity claim.
     */
    async attach<T extends { metadata: { id: string; is_limited?: boolean | undefined; reserve_character?: string | null | undefined }; cards?: DeckCard[] }>(view: T): Promise<T & { evaluation: DeckDraftEvaluationDto | null; evaluationError?: 'DRAFT_EVALUATION_UNAVAILABLE' }> {
        const snapshot = structuredClone(view);
        try {
            const groups = new Map<string, EvaluateDraftInput['cards'][number]>();
            for (const c of snapshot.cards ?? []) {
                const key = deckCardMapKey(c);
                const existing = groups.get(key);
                if (existing) {
                    existing.quantity += c.quantity;
                    existing.exclude_from_draw = existing.exclude_from_draw || c.exclude_from_draw === true;
                } else {
                    groups.set(key, { type: c.type, cardId: c.cardId, quantity: c.quantity, exclude_from_draw: c.exclude_from_draw === true });
                }
            }
            const evaluation = await this.evaluate({ schemaVersion: 1, draftId: snapshot.metadata.id, revision: 0, cards: [...groups.values()], reserveCharacterId: snapshot.metadata.reserve_character ?? null, limited: snapshot.metadata.is_limited ?? false, format: 'venture', koCharacterIds: [] });
            return { ...snapshot, evaluation };
        } catch {
            return { ...snapshot, evaluation: null, evaluationError: 'DRAFT_EVALUATION_UNAVAILABLE' };
        }
    }
    async validateForPersistence(cards: DeckCard[]) {
        const groups = new Map<string, EvaluateDraftInput['cards'][number]>();
        for (const c of cards) {
            const key = deckCardMapKey(c);
            const existing = groups.get(key);
            if (!Number.isInteger(c.quantity) || c.quantity < 1 || c.quantity > 100)
                throw new DraftStructureError('Quantity must be an integer between 1 and 100');
            if (existing) {
                existing.quantity += c.quantity;
                existing.exclude_from_draw = existing.exclude_from_draw || c.exclude_from_draw === true;
                if (existing.quantity > 100)
                    throw new DraftStructureError('Aggregate quantity must not exceed 100 for one typed identity');
            }
            else
                groups.set(key, { type: c.type, cardId: c.cardId, quantity: c.quantity, exclude_from_draw: c.exclude_from_draw === true });
        }
        const result = await this.evaluate({ schemaVersion: 1, draftId: 'saved-validation', revision: 0, cards: [...groups.values()], reserveCharacterId: null, limited: false, format: 'venture', koCharacterIds: [] });
        return result.legality.reasons;
    }
    async evaluate(input: EvaluateDraftInput): Promise<DeckDraftEvaluationDto> {
        const catalog = await this.validator.resolveCatalog();
        const cards: DeckCard[] = input.cards.map((card, i) => ({ id: `draft-${i}`, type: card.type.replace(/_/g, '-') as DeckCard['type'], cardId: card.cardId, quantity: card.quantity, exclude_from_draw: card.exclude_from_draw === true }));
        const keys = new Set<string>();
        for (const card of cards) {
            const key = deckCardMapKey(card);
            if (!Number.isInteger(card.quantity) || card.quantity < 1 || card.quantity > 100)
                throw new DraftStructureError('Quantity must be an integer between 1 and 100');
            if (!catalog.has(key))
                throw new DraftStructureError('A referenced card does not exist for its type');
            if (keys.has(key))
                throw new DraftStructureError('Aggregate each typed card identity into one row');
            keys.add(key);
        }
        const characterCards = cards.filter(card => card.type === 'character');
        const characterIds = new Set(characterCards.map(card => card.cardId));
        if (input.reserveCharacterId && !characterIds.has(input.reserveCharacterId))
            throw new DraftStructureError('Reserve character must belong to the draft');
        if (input.koCharacterIds.some(id => !characterIds.has(id)))
            throw new DraftStructureError('KO character must belong to the draft');
        const printed = characterCards.map(card => {
            const c = catalog.get(deckCardMapKey(card))!;
            return { name: String(c.name), energy: Number(c.energy ?? 0), combat: Number(c.combat ?? 0), brute_force: Number(c.brute_force ?? 0), intelligence: Number(c.intelligence ?? 0) };
        });
        const ordinary = effectiveTeamCharacterStats(printed);
        // KO baseline uses Power/Training overrides, even after their source teammate is KO'd.
        const effective = ordinary.map(c => ({ ...c, brute_force: Math.max(c.brute_force, c.name.toLowerCase().includes('john carter') ? 8 : 0), intelligence: Math.max(c.intelligence, c.name.toLowerCase().includes('time traveler') ? 8 : 0) }));
        const ko = new Set(input.koCharacterIds);
        const active = effective.filter((_, i) => !ko.has(characterCards[i].cardId));
        const reasons = this.validator.validateResolvedDeck(cards, catalog);
        const physical = countPlayableCards(cards);
        const drawPile = countCardsInDeck(cards);
        const legalityThreat = cards.filter(c => c.type === 'character' || c.type === 'location').reduce((sum, c) => sum + characterThreatValue(catalog.get(deckCardMapKey(c))!) * c.quantity, 0);
        return {
            schemaVersion: 1, draftId: input.draftId, revision: input.revision, inputKey: evaluationInputKey(input),
            versions: { catalog: crypto.createHash('sha256').update(JSON.stringify([...catalog])).digest('hex'), rules: 'venture-editor-compatibility-v1' },
            policy: { format: input.format, limited: input.limited },
            legality: { valid: input.limited || reasons.length === 0, rawValid: reasons.length === 0, reasons },
            threat: { editor: calculateDeckTotalThreat(cards, input.reserveCharacterId, (type, cardId) => catalog.get(deckCardMapKey({ type: type as DeckCard['type'], cardId }))), legality: legalityThreat },
            grids: { printedMaximums: maximum(printed), effectiveMaximums: maximum(effective), activeMaximums: maximum(active), editorMaximums: ko.size ? maximum(active) : maximum(ordinary), characters: characterCards.map((c, i) => ({ cardId: c.cardId, printed: grid(printed[i]), effective: grid(effective[i]), active: !ko.has(c.cardId) })) },
            icons: calculateDeckIconTotals(cards, (type, cardId) => catalog.get(deckCardMapKey({ type: type as DeckCard['type'], cardId }))),
            counts: { physicalPlayable: physical, drawPile, prePlaced: physical - drawPile, exportCards: physical },
            capabilities: { drawHand: canDrawHand(cards) }
        };
    }
}
