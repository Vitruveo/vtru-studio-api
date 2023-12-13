import { z } from 'zod';

export const COLLECTION_ASSETS = 'assets';

export const AssetsSchema = z.object({
    key: z.string().default(''),
    mimetype: z.string().default(''),
    creators: z.array(z.string()).default([]),
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
export type AssetsDocument = Assets & { _id: string };
