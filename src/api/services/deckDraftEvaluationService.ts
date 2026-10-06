import type { DeckExportDto } from '../dto/v1/DeckExportDto';
import type { DrawDraftDto } from '../dto/v1/DrawDraftDto';
import type { HandAnalysisDto } from '../dto/v1/HandAnalysisDto';
import type { DeckSummaryDto } from '../dto/v1/DeckSummaryDto';
import { maximumGrid as maximum } from '../../services/deck-preview/teamGrid';
import { computePrePlacedFlags, isPrePlacedEligible } from '../../services/deck-preview/prePlaced';
import { extractCardsFromImportJson } from '../../services/deck-preview/extractCardsFromImportJson';
import { findCharacterIdByName, resolveImportCardIds } from '../../services/deck-preview/resolveImportCardIds';
import type { ImportDeckJson } from '../../services/deck-preview/importTypes';
import { buildKoDimmingContext, shouldDimDeckCard } from '../../services/deck-preview/simulateKo';
import { drawRandomHand } from '../../services/deck-preview/drawHand';
import { analyzeDrawnHand } from '../../services/deck-preview/drawHandAnalysis';
import { buildDeckExportJson } from '../../services/deck-preview/buildDeckExportJson';
import type { DeckCardEntry } from '../../services/deck-preview/types';
import crypto from 'crypto';
import { maxCopiesForAddCards } from '../../services/deck-candidates/editorCopyCeiling';
import { candidateContext, candidateCatalogKey } from '../../services/deck-candidates/context';
import { candidateInputKey } from '../../services/deck-candidates/inputKey';
import { isCatalogCardUsable } from '../../services/deck-candidates/isCatalogCardUsable';
import type { CatalogCard } from '../../services/catalog-presentation/types';
import type { EvaluateCandidatesInput } from '../http/models/decks/EvaluateCandidatesRequestBody';
import type { DeckCandidatesEvaluationDto, DeckCandidateDecision } from '../dto/v1/DeckCandidatesEvaluationDto';

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
    /** Stateless Add Cards compatibility decisions; never grants permission to write a deck. */
    async evaluateCandidates(input: EvaluateCandidatesInput): Promise<DeckCandidatesEvaluationDto> {
        const catalog = await this.validator.resolveCatalog();
        const keys = new Set<string>();
        for (const card of input.cards) {
            const key = candidateCatalogKey(card.type, card.cardId);
            if (!catalog.has(key) || keys.has(key) || !Number.isInteger(card.quantity) || card.quantity < 1 || card.quantity > 100)
                throw new DraftStructureError('Draft identities must exist and be aggregated with bounded quantities');
            keys.add(key);
        }
        const ctx = candidateContext(input.cards, catalog);
        const deckTypes = { characters: 'character', 'special-cards': 'special', 'power-cards': 'power', missions: 'mission', events: 'event', locations: 'location', battlegrounds: 'battleground', aspects: 'aspect', 'advanced-universe': 'advanced-universe', teamwork: 'teamwork', 'ally-universe': 'ally-universe', training: 'training', 'basic-universe': 'basic-universe' } as const;
        const candidates = input.candidates.map(candidate => {
            const row = catalog.get(candidateCatalogKey(deckTypes[candidate.catalogType], candidate.cardId));
            if (!row) throw new DraftStructureError('A candidate does not exist for its type');
            // The validation index stores a deck type in `type`; Basic Universe's printed grid skill is separate.
            const card = { ...row, ...(candidate.catalogType === 'basic-universe' ? { type: row.basic_skill_type } : {}) } as CatalogCard;
            const usable = isCatalogCardUsable(card, candidate.catalogType, ctx);
            const code: DeckCandidateDecision['reasons'][number]['code'] = candidate.catalogType === 'aspects' ? 'HOMEBASE' : candidate.catalogType === 'events' ? 'MISSION_SET' : ['special-cards', 'advanced-universe'].includes(candidate.catalogType) ? 'STARTING_TEAM' : 'POWER_GRID';
            const messages = { HOMEBASE: 'Requires a matching homebase.', MISSION_SET: 'Requires a matching mission set.', STARTING_TEAM: 'Requires matching starting-team or battleground conditions.', POWER_GRID: 'No starting-team character meets this card’s use requirement.' };
            return { ...candidate, usable, reasons: usable ? [] : [{ code, message: messages[code] }], maxCopies: maxCopiesForAddCards(card) };
        });
        return { schemaVersion: 1, revision: input.revision, inputKey: candidateInputKey(input), versions: { catalog: crypto.createHash('sha256').update(JSON.stringify([...catalog])).digest('hex'), rules: 'add-cards-compatibility-v1' }, candidates,
            missionLimitReached: input.cards.filter(c => c.type === 'mission').reduce((n, c) => n + c.quantity, 0) >= 7 };
    }
    async evaluate(input: EvaluateDraftInput, resolvedCatalog?: Awaited<ReturnType<Validator['resolveCatalog']>>): Promise<DeckDraftEvaluationDto> {
        const catalog = resolvedCatalog ?? await this.validator.resolveCatalog();
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
        const previewCards = cards.flatMap(c => Array.from({ length:c.quantity }, (_, i) => ({ ...c, quantity:1, exclude_from_draw:c.exclude_from_draw === true && i === 0 })));
        const previewCatalog = new Map([...catalog].map(([key,c]) => { const type=key.slice(0,-String(c.id).length-1).replace(/_/g,'-'); return [`${type}:${c.id}`, { ...c, id:String(c.id), type:type === 'basic-universe' ? c.basic_skill_type ?? c.type : c.type ?? type } as CatalogCard] as const; }));
        const koContext = buildKoDimmingContext(previewCards, previewCatalog, ko);
        const prePlacedFlags = computePrePlacedFlags(previewCards,previewCatalog);
        const addTeam = effectiveTeamCharacterStats(printed.slice(0,4));
        return {
            prePlacedEligible: Object.fromEntries(cards.map(c => [`${c.type}:${c.cardId}`,isPrePlacedEligible(c,prePlacedFlags,previewCatalog)])),
            koDimming: Object.fromEntries(cards.map(c => [`${c.type}:${c.cardId}`, shouldDimDeckCard(c, previewCatalog.get(`${c.type}:${c.cardId}`), koContext)])),
            addCardsTeam: addTeam.map((c,i) => ({ cardId:characterCards[i].cardId, energy:c.energy, combat:c.combat, brute_force:c.brute_force, intelligence:c.intelligence })),
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
    async prepareImport(data:ImportDeckJson, name:string) {
        const catalog = await this.validator.resolveCatalog();
        const entries = extractCardsFromImportJson(data.cards);
        if (!entries.length) throw new DraftStructureError('No cards found in import data');
        if (entries.length > 1000) throw new DraftStructureError('Import exceeds 1000 card copies');
        const { resolved, unresolved } = resolveImportCardIds(catalog,entries);
        if (unresolved.length) return { ok:false as const, code:'unresolved' as const, message:'Could not resolve all cards in the import JSON', unresolved:unresolved.map(c => ({name:c.name,type:c.type})) };
        const reserve = data.reserve_character ? findCharacterIdByName(catalog,data.reserve_character) : null;
        const cards = resolved.map(c => ({type:c.cardType.replace(/_/g,'-') as DeckCardEntry['type'], cardId:c.cardId,quantity:c.quantity}));
        const evaluation = await this.evaluate({schemaVersion:1,draftId:'import-preview',revision:0,cards,reserveCharacterId:reserve,limited:data.limited ?? false,format:'venture',koCharacterIds:[]},catalog);
        return {ok:true as const, name:name.trim() || data.name?.trim() || 'Imported Deck', description:data.description?.trim() || '', cards, reserveCharacterId:reserve, limited:data.limited ?? false, evaluation};
    }
    async summaries(inputs: EvaluateDraftInput[]):Promise<DeckSummaryDto[]> {
        const catalog = await this.validator.resolveCatalog();
        return Promise.all(inputs.map(async input => {
            const evaluation = await this.evaluate(input,catalog);
            return { draftId:input.draftId, inputKey:evaluation.inputKey, grid:evaluation.grids.characters.length ? evaluation.grids.editorMaximums : null };
        }));
    }
    private async preview(input: EvaluateDraftInput) {
        const catalog = await this.validator.resolveCatalog();
        const evaluation = await this.evaluate(input, catalog);
        const cards: DeckCardEntry[] = input.cards.map(c => ({ ...c, exclude_from_draw:c.exclude_from_draw === true, type:c.type.replace(/_/g,'-') as DeckCardEntry['type'] }));
        const cardIndex = new Map([...catalog].map(([key,c]) => { const type=key.slice(0,-String(c.id).length-1).replace(/_/g,'-'); return [`${type}:${c.id}`, { ...c, id:String(c.id), type:type === 'basic-universe' ? c.basic_skill_type ?? c.type : c.type ?? type } as CatalogCard] as const; }));
        return { evaluation, cards, cardIndex };
    }
    async draw(input: EvaluateDraftInput):Promise<DrawDraftDto> {
        const { evaluation, cards } = await this.preview(input);
        if (!evaluation.capabilities.drawHand) throw new DraftStructureError('The draft is not eligible for drawing a hand');
        const hand = drawRandomHand(cards).map((c,i) => ({ ...c, quantity:1, exclude_from_draw:false, instanceId:`draw-${i}` }));
        return { schemaVersion:1 as const, inputKey:evaluation.inputKey, revision:input.revision, cards:hand };
    }
    async analyzeHand(input: EvaluateDraftInput, hand: Array<{ type:string; cardId:string }>):Promise<HandAnalysisDto> {
        const { evaluation, cards, cardIndex } = await this.preview(input);
        const available = new Map(cards.map(c => [`${c.type}:${c.cardId}`, c.quantity - (c.exclude_from_draw ? 1 : 0)]));
        const drawn = hand.map(c => {
            const type = c.type.replace(/_/g,'-') as DeckCardEntry['type'];
            const key = `${type}:${c.cardId}`;
            const remaining = available.get(key) ?? 0;
            if (remaining < 1 || ['character','location','battleground','mission'].includes(type)) throw new DraftStructureError('Hand must contain available draw-pile copies from the draft');
            available.set(key, remaining - 1);
            return { type, cardId:c.cardId, quantity:1 };
        });
        const result = analyzeDrawnHand(drawn, cards, cardIndex);
        return { schemaVersion:1 as const, inputKey:evaluation.inputKey, revision:input.revision, ventureTotal:result.ventureTotal, duplicateCount:result.duplicateCount, duplicateCardIndexes:[...result.duplicateCardIndexes] };
    }
    async exportDraft(input: EvaluateDraftInput, display: { name:string; description:string; exportedBy:string; surface:'editor'|'selection' }):Promise<DeckExportDto> {
        const { evaluation, cards, cardIndex } = await this.preview(input);
        return { schemaVersion:1 as const, inputKey:evaluation.inputKey, revision:input.revision, deck:buildDeckExportJson({ ...display, cards, cardIndex,
            reserveCharacterId:input.reserveCharacterId, limited:input.limited, legal:evaluation.legality.rawValid,
            maxStats:display.surface === 'selection' ? evaluation.grids.printedMaximums : evaluation.grids.editorMaximums,
            iconTotals:evaluation.icons, totalThreat:evaluation.threat.editor, totalCards:evaluation.counts.exportCards }) };
    }

}
