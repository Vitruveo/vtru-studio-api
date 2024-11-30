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

const nestedArraySchema = z.tuple([z.string(), z.string()]);
export const schemaValidationArtworks = z.object({
    general: z.object({
        shortcuts: z
            .object({
                hideNudity: z.boolean().optional(),
                hideAI: z.boolean().optional(),
                photography: z.boolean().optional(),
                animation: z.boolean().optional(),
                physicalArt: z.boolean().optional(),
                digitalArt: z.boolean().optional(),
                includeSold: z.boolean().optional(),
                hasBTS: z.boolean().optional(),
            })
            .optional(),
        licenses: z
            .object({
                minPrice: z.number().optional(),
                maxPrice: z.number().optional(),
                enabled: z.boolean().optional(),
            })
            .optional(),
    }),
    context: z.object({
        culture: z.array(nestedArraySchema).optional(),
        mood: z.array(nestedArraySchema).optional(),
        orientation: z.array(nestedArraySchema).optional(),
        precision: z.number().optional(),
        colors: z.array(z.string()).optional(),
    }),
    taxonomy: z.object({
        objectType: z.array(nestedArraySchema).optional(),
        tags: z.array(nestedArraySchema).optional(),
        collections: z.array(nestedArraySchema).optional(),
        aiGeneration: z.array(nestedArraySchema).optional(),
        arEnabled: z.array(nestedArraySchema).optional(),
        nudity: z.array(nestedArraySchema).optional(),
        category: z.array(nestedArraySchema).optional(),
        medium: z.array(nestedArraySchema).optional(),
        style: z.array(nestedArraySchema).optional(),
        subject: z.array(nestedArraySchema).optional(),
    }),
    artists: z.object({
        name: z.array(nestedArraySchema).optional(),
        nationality: z.array(nestedArraySchema).optional(),
        residence: z.array(nestedArraySchema).optional(),
    }),
});

export const schemaValidationStepName = z.object({
    stepName: z.enum(['organization', 'artworks']),
    data: z.any(),
});
