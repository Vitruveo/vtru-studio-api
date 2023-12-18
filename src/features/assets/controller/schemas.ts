import { z } from 'zod';

export const schemaValidationForCreate = z.object({
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
});
export const schemaValidationForUpdate = z.object({
    domain: z.string(),
    media: z.object({
        path: z.string(),
        originalName: z.string(),
        mimetype: z.string(),
        size: z.number(),
    }),
    formats: z.array(
        z.object({
            definition: z.string(),
            name: z.string(),
            path: z.string(),
        })
    ),
    license: z
        .object({
            type: z.string().default(''),
            url: z.string().default(''),
        })
        .default({}),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});
