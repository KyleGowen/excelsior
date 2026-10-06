import type { DeckMetricGrid } from '../../api/dto/v1/DeckDraftEvaluationDto';
export function maximumGrid(rows:Array<{energy:number;combat:number;brute_force:number;intelligence:number}>):DeckMetricGrid {
 return rows.reduce((acc,c)=>({energy:Math.max(acc.energy,c.energy),combat:Math.max(acc.combat,c.combat),bruteForce:Math.max(acc.bruteForce,c.brute_force),intelligence:Math.max(acc.intelligence,c.intelligence)}),{energy:0,combat:0,bruteForce:0,intelligence:0});
}
