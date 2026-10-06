// Frontend transport contract. Checked against the server by check:contracts.
import type { ValidationError } from './validation-error';
export interface DeckMetricGrid {
    energy: number;
    combat: number;
    bruteForce: number;
    intelligence: number;
}
export interface DeckDraftEvaluationDto {
    schemaVersion: 1;
    draftId: string;
    revision: number;
    /** Exact normalized input identity; does not contain catalog values or credentials. */
    inputKey: string;
    versions: {
        catalog: string;
        rules: string;
    };
    policy: {
        format: 'venture';
        limited: boolean;
    };
    legality: {
        valid: boolean;
        rawValid: boolean;
        reasons: ValidationError[];
    };
    threat: {
        editor: number;
        legality: number;
    };
    grids: {
        printedMaximums: DeckMetricGrid;
        effectiveMaximums: DeckMetricGrid;
        activeMaximums: DeckMetricGrid;
        editorMaximums: DeckMetricGrid;
        characters: Array<{
            cardId: string;
            printed: DeckMetricGrid;
            effective: DeckMetricGrid;
            active: boolean;
        }>;
    };
    icons: DeckMetricGrid;
    counts: {
        physicalPlayable: number;
        drawPile: number;
        prePlaced: number;
        exportCards: number;
    };
    /** Server decisions for this exact draft; absent only on older servers/fixtures. */
    prePlacedEligible?: Record<string, boolean>;
    koDimming?: Record<string, boolean>;
    addCardsTeam?: Array<{ cardId: string; energy: number; combat: number; brute_force: number; intelligence: number }>;
    capabilities: {
        drawHand: boolean;
    };
}
