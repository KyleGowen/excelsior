import { evaluateCollection } from '../../../src/services/collection-evaluation/evaluateCollection';
import { CollectionEvaluationRequestBody } from '../../../src/api/http/models/collections/CollectionEvaluationRequestBody';
import { serviceScopeForOperation } from '../../../src/api/access/serviceOperations';
const row = (quantity: number, imagePath = 'base') => ({cardId:'fictional-card',cardType:'character',imagePath,quantity});
it('preserves printing row totals and last printing display quantity without collapsing variants', () => {
 const entries=[row(2),row(3,'foil'),row(0,'empty')]; const before=JSON.stringify(entries);
 expect(evaluateCollection(entries,'device',true)).toEqual({totalOwned:5,uniqueCards:2,quantities:{'character:fictional-card':3},capabilities:{canSetQuantity:true,storage:'device',minimumQuantity:0,maximumQuantity:99}});
 expect(JSON.stringify(entries)).toBe(before);
});
it('does not grant account writes for a denied evaluation context', () => {expect(evaluateCollection([],'account',false).capabilities.canSetQuantity).toBe(false);});
it.each([-1,0.5,Infinity,Number.MAX_SAFE_INTEGER+1])('rejects invalid quantity %s', quantity => {expect(CollectionEvaluationRequestBody.safeParse({entries:[row(quantity)]}).success).toBe(false);});
it('rejects unsafe sum, invalid type, oversized snapshots and injected identity', () => {
 for(const input of [{entries:[row(Number.MAX_SAFE_INTEGER),row(1)]},{entries:[{...row(1),cardType:'users'}]},{entries:Array(10001).fill(row(1))},{entries:[],userId:'other',storage:'account'}])expect(CollectionEvaluationRequestBody.safeParse(input).success).toBe(false);
});
it('maps stateless collection evaluation to read scope, without allowing arbitrary methods', () => {expect(serviceScopeForOperation('POST','/api/v1/collections/evaluate')).toBe('collections:read');expect(serviceScopeForOperation('DELETE','/api/v1/collections/evaluate')).toBeNull();});
it('allows catalog presentation through service adapters without opening unrelated nested operations', () => {
 expect(serviceScopeForOperation('GET','/api/v1/catalog/presentation/characters')).toBe('catalog:read');
 for (const [method,path] of [['POST','/api/v1/catalog/presentation/characters'],['GET','/api/v1/catalog/presentation/characters/admin'],['GET','/api/v1/catalog/admin/users']]) expect(serviceScopeForOperation(method,path)).toBeNull();
});
