import { z } from 'zod';

export const COLLECTION_ASSETS = 'assets';

export const AssetsSchema = z.object({
    domain: z.string().default(''),
    media: z.object({
        path: z.string().default(''),
        originalName: z.string().default(''),
        mimetype: z.string().default(''),
        size: z.number().default(0),
    }),
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
export type AssetsDocument = Assets & { _id: string };
