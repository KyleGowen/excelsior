import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname,'../..');
const pairs = {
 'src/api/dto/v1/DeckExportDto.ts':'DeckExportDto.ts',
 'src/api/dto/v1/DrawDraftDto.ts':'DrawDraftDto.ts',
 'src/api/dto/v1/HandAnalysisDto.ts':'HandAnalysisDto.ts',
 'src/api/dto/v1/DeckSummaryDto.ts':'DeckSummaryDto.ts',
 'src/api/dto/v1/DeckImportDto.ts':'DeckImportDto.ts',
 'src/api/dto/v1/DeckDraftEvaluationDto.ts':'DeckDraftEvaluationDto.ts',
 'src/api/dto/v1/DeckCandidatesEvaluationDto.ts':'DeckCandidatesEvaluationDto.ts',
 'src/api/dto/v1/CatalogPresentationDto.ts':'CatalogPresentationDto.ts',
 'src/services/deck-validation/validation-error.ts':'validation-error.ts',
 'src/services/deck-evaluation/draftInput.ts':'draftInput.ts',
 'src/services/deck-candidates/inputKey.ts':'inputKey.ts'
};
for (const [server,client] of Object.entries(pairs)) {
 const expected = readFileSync(resolve(root,server),'utf8').replaceAll('../../../services/deck-validation/validation-error','./validation-error');
 const actual = readFileSync(resolve(root,'frontend/src/contracts',client),'utf8').replace(/^\/\/ Frontend transport contract[^\n]*\n/,'');
 if (actual !== expected) throw new Error(`Frontend transport contract drift: ${client}. Review the API change and update the checked frontend contract.`);
}
console.log(`PASS: ${Object.keys(pairs).length} frontend-safe transport contracts match the server. No server input is required by build:modules.`);
