import { z } from 'zod';
import {AccountDeckDeleteRequestBody} from './AccountDeckDeleteRequestBody';
export const AccountDeckMetadataRequestBody=AccountDeckDeleteRequestBody.extend({name:z.string().trim().min(1).max(100).optional(),description:z.string().max(500).optional(),isPrivate:z.boolean().optional()}).refine(value=>value.name!==undefined||value.description!==undefined||value.isPrivate!==undefined);
export type AccountDeckMetadataInput=z.infer<typeof AccountDeckMetadataRequestBody>;
