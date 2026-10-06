export type DeckImportDto = {ok:true;deckId:string;userId:string;cardsAdded:number} | {ok:false;code:'unresolved';message:string;unresolved:Array<{name:string;type:string}>};
