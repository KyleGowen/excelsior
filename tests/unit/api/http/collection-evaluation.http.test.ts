import express, {type RequestHandler} from 'express';
import request from 'supertest';
import {registerCollectionEvaluationV1HttpRoutes} from '../../../../src/api/http/collection-evaluation.http';
import type {CollectionService} from '../../../../src/services/collectionService';
const make = (role='USER', fail=false) => {
 const service={getCollectionView:jest.fn(fail?async()=>{throw new Error('private detail');}:async()=>({cards:[],evaluation:{totalOwned:0}}))} as unknown as CollectionService;
 const auth:RequestHandler=(req,res,next)=>{if(role==='NONE'){res.status(401).json({errors:[{code:'UNAUTHORIZED'}]});return;}req.user={id:'verified-owner',name:'Fictional',email:'fixture@example.test',role:role as 'USER'};next();};
 const app=express();app.use(express.json());registerCollectionEvaluationV1HttpRoutes(app,service,auth);return{app,service};
};
it('public draft evaluation is no-store and calls no persistence method',async()=>{const{app,service}=make();const r=await request(app).post('/collections/evaluate').send({entries:[{cardId:'fictional',cardType:'character',imagePath:'foil',quantity:2}]}).expect(200);expect(r.body.data.totalOwned).toBe(2);expect(r.body.data.capabilities.storage).toBe('device');expect(r.headers['cache-control']).toBe('no-store');expect(service.getCollectionView).not.toHaveBeenCalled();});
it('rejects malformed public input without evaluating or persisting',async()=>{const{app,service}=make();const r=await request(app).post('/collections/evaluate').send({entries:[],role:'ADMIN'}).expect(400);expect(r.body.errors[0].code).toBe('VALIDATION_ERROR');expect(service.getCollectionView).not.toHaveBeenCalled();});
it.each(['USER','ADMIN'])('saved view derives current %s identity rather than query identity',async role=>{const{app,service}=make(role);const r=await request(app).get('/collections/me/view?userId=other').expect(200);expect(service.getCollectionView).toHaveBeenCalledWith('verified-owner');expect(r.headers['cache-control']).toBe('no-store');});
it('denies unauthenticated requests',async()=>{await request(make('NONE').app).get('/collections/me/view').expect(401);});
it('denies Guest before getOrCreate can persist anything',async()=>{const{app,service}=make('GUEST');await request(app).get('/collections/me/view').expect(403);expect(service.getCollectionView).not.toHaveBeenCalled();});
it('returns bounded retry failure without private exception content',async()=>{const r=await request(make('USER',true).app).get('/collections/me/view').expect(503);expect(r.body.errors[0].code).toBe('COLLECTION_VIEW_UNAVAILABLE');expect(JSON.stringify(r.body)).not.toContain('private detail');});
