import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_STORES = 'stores';

export const MediaSchema = z.object({
    name: z.string(),
    path: z.string(),
});

export const FormatSchema = z.object({
    logo: z.object({
        horizontal: MediaSchema.nullable().default(null),
        square: MediaSchema.nullable().default(null),
    }),
    banner: MediaSchema.nullable().default(null),
});

export const OrganizationSchema = z.object({
    url: z.string().nullable().default(null),
    name: z.string(),
    description: z.string().nullable().default(null),
    markup: z.number().default(0),
    formats: FormatSchema.default({
        logo: { horizontal: null, square: null },
        banner: null,
    }),
});

export const ArtworksSchema = z.object({
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

export const AppearanceContentSchema = z.object({
    highlightColor: z.string().default('#000000'),
    hideElements: z.object({
        filters: z.boolean().default(false),
        order: z.boolean().default(false),
        header: z.boolean().default(false),
        recentlySold: z.boolean().default(false),
        artworkSpotlight: z.boolean().default(false),
        artistSpotlight: z.boolean().default(false),
        pageNavigation: z.boolean().default(false),
        cardDetails: z.boolean().default(false),
        assets: z.boolean().default(false),
    }),
});

export const FrameworkSchema = z.object({
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date()),
    createdBy: z.string().nullable().default(null),
    updatedBy: z.string().nullable().default(null),
});

export const StoreStatusEnum = z.enum([
    'draft',
    'pending',
    'active',
    'inactive',
]);

export const StoresSchema = z.object({
    organization: OrganizationSchema.optional(),
    artworks: ArtworksSchema.optional(),
    appearanceContent: AppearanceContentSchema.optional(),
    hash: z.string().default(''),
    framework: FrameworkSchema.default({}),
    status: StoreStatusEnum.default('draft'),
    actions: z.object({ countClone: z.number().default(0) }).optional(),
});

export type Stores = z.infer<typeof StoresSchema>;
export type StoreStatus = z.infer<typeof StoreStatusEnum>;
export type StoresDocument = Stores & { _id: string | ObjectId };
