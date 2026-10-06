// Frontend transport contract. Checked against the server by check:contracts.
export interface DeckSummaryDto {draftId:string;inputKey:string;grid:{energy:number;combat:number;bruteForce:number;intelligence:number}|null;}
