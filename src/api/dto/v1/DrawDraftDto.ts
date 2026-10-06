export interface DrawDraftDto {
 schemaVersion:1; inputKey:string; revision:number;
 cards:Array<{type:'character'|'special'|'power'|'mission'|'event'|'location'|'battleground'|'aspect'|'advanced-universe'|'teamwork'|'ally-universe'|'training'|'basic-universe';cardId:string;quantity:number;exclude_from_draw?:boolean;instanceId?:string}>;
}
