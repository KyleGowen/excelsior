import type { Router,RequestHandler } from 'express';
import type { DeckImportService } from '../services/deckImportService';
import { DraftStructureError } from '../services/deckDraftEvaluationService';
import { ImportDeckRequestBody } from './models/decks/ImportDeckRequestBody';
import { sendV1Success,sendV1Json } from './v1Envelope';
import { createV1RateLimit } from './middleware/v1RateLimit';
import { blockInReadOnlyMode } from '../../routes/helpers';
export function registerDeckImportV1HttpRoutes(router:Router,service:DeckImportService,authenticate:RequestHandler):void {
 const limit=createV1RateLimit({routeKey:'deck-import',budget:{limit:20,windowMs:60000}});
 const handler=(guest:boolean):RequestHandler => async (req,res) => {
  res.set('Cache-Control','no-store');
  if (!req.user) { sendV1Json(res,401,null,[{code:'UNAUTHORIZED',message:'Authentication required'}]);return; }
  if ((req.user.role === 'GUEST') !== guest) {sendV1Json(res,403,null,[{code:'FORBIDDEN',message:'Use the appropriate owned or Guest import endpoint'}]);return;}
  const sessionId=guest ? req.cookies?.sessionId : undefined;
  if (guest && (typeof sessionId !== 'string' || !sessionId)) {sendV1Json(res,401,null,[{code:'SESSION_REQUIRED',message:'Session required for Guest import'}]);return;}
  if (!guest && blockInReadOnlyMode(req,res,'deck import',{v1:true})) return;
  const parsed=ImportDeckRequestBody.safeParse(req.body);
  if(!parsed.success) {sendV1Json(res,400,null,[{code:'VALIDATION_ERROR',message:'Invalid deck import input'}]);return;}
  try {
   const result=await service.import(parsed.data,{userId:req.user.id,...(guest ? {guestSessionId:sessionId as string} : {})});
   if(!result.ok) {sendV1Json(res,400,result,[{code:'IMPORT_UNRESOLVED',message:result.message}]);return;}
   sendV1Success(res,result,201);
  } catch(error) {
   if(error instanceof DraftStructureError) sendV1Json(res,400,null,[{code:'DRAFT_STRUCTURE_INVALID',message:error.message}]);
   else sendV1Json(res,503,null,[{code:'DECK_IMPORT_UNAVAILABLE',message:'Import confirmation is unavailable. Check your deck list before retrying.'}]);
  }
 };
 router.post('/decks/import',authenticate,limit,handler(false));
 router.post('/guest/decks/import',authenticate,limit,handler(true));
}
