import { z } from 'zod';
import { FormatSchema } from '../model';

export const schemaValidationForCreateStores = z.object({
    organization: z
        .object({
            // rules lower case a - z and 0 - 9 and hyphen and min 4 char
            url: z.string().nullable().default(null),
            name: z.string().default(''),
            description: z.string().nullable().default(null),
            markup: z.number().default(0),
            formats: FormatSchema.default({
                logo: { horizontal: null, square: null },
                banner: null,
            }),
        })
        .default({}),
    cloneId: z.string().optional(),
});

export const schemaValidationOrganization = z.object({
    url: z.string().nullable().default(null),
    name: z.string().default(''),
    description: z.string().nullable().default(null),
    markup: z.number().default(0),
    formats: FormatSchema.nullable().default(null),
});

export const schemaValidationStepName = z.object({
    stepName: z.enum(['organization']),
    data: z.any(),
});
