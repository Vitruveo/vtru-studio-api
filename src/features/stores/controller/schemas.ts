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
    hasBanner: z.boolean().nullable().default(null),
});

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
        culture: z.array(z.string()).optional(),
        mood: z.array(z.string()).optional(),
        orientation: z.array(z.string()).optional(),
        precision: z.number().optional(),
        colors: z.array(z.string()).optional(),
    }),
    taxonomy: z.object({
        objectType: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        collections: z.array(z.string()).optional(),
        aiGeneration: z.array(z.string()).optional(),
        arEnabled: z.array(z.string()).optional(),
        nudity: z.array(z.string()).optional(),
        category: z.array(z.string()).optional(),
        medium: z.array(z.string()).optional(),
        style: z.array(z.string()).optional(),
        subject: z.array(z.string()).optional(),
    }),
    artists: z.object({
        name: z.array(z.string()).optional(),
        nationality: z.array(z.string()).optional(),
        residence: z.array(z.string()).optional(),
    }),
});

export const schemaValidationStepName = z.object({
    stepName: z.enum(['organization', 'artworks']),
    data: z.any(),
});
