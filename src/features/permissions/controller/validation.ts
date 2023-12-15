import { z } from 'zod';

export const schemaQuery = z.object({
    sort: z
        .object({
            field: z.string(),
            order: z.number(),
        })
        .nullable()
        .default(null),
    skip: z.number().nullable().default(null),
    limit: z.number().nullable().default(null),
});
