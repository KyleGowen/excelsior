import {z} from 'zod';
import {ImportDeckRequestBody} from './ImportDeckRequestBody';
export const AccountDeckImportRequestBody=ImportDeckRequestBody.extend({operationId:z.string().uuid()});
