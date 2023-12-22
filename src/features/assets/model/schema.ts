import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_ASSETS = 'assets';

export const AssetsSchema = z.object({
    domain: z.string().default(''),
    status: z.enum(['draft', 'published', 'archived']),

    formats: z.array(
        z.object({
            definition: z.string().default(''),
            name: z.string().default(''),
            path: z.string().default(''),
        })
    ),
    license: z
        .object({
            type: z.string().default(''),
            url: z.string().default(''),
        })
        .default({}),
    framework: z
        .object({
            createdAt: z.date().default(new Date()),
            updatedAt: z.date().default(new Date()),
            createdBy: z.string().nullable().default(null),
            updatedBy: z.string().nullable().default(null),
        })
        .default({}),
});

export type Assets = z.infer<typeof AssetsSchema>;
export type AssetsDocument = Assets & { _id: string | ObjectId };
