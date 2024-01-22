import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_ALLOW_LIST = 'allowList';

const framework = z
    .object({
        createdAt: z.date().default(new Date()),
        updatedAt: z.date().default(new Date()),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    })
    .default({});

export const AllowListSchema = z.object({
    email: z.string().default(''),
    framework,
});

export type AllowList = z.infer<typeof AllowListSchema>;
export type AllowListDocument = AllowList & { _id: string | ObjectId };
