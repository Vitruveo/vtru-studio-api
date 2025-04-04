import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_ASSETS = 'assets';

const RGBSchema = z.array(z.number());
export const ColorsSchema = z.array(RGBSchema);

const TermsSchema = z.object({
    isOriginal: z.boolean(),
    contract: z.boolean(),
    generatedArtworkAI: z.boolean(),
    notMintedOtherBlockchain: z.boolean(),
});

const ActionsSchema = z.object({ countClone: z.number().default(0) });

export const AssetsSchema = z.object({
    assetRefId: z.number().nullable().default(null),
    uploadedMediaKeys: z.array(z.string()).default([]),
    domain: z.string().default(''),
    status: z
        .enum(['draft', 'published', 'archived', 'preview'])
        .default('draft'),
    formats: z.object({
        original: z
            .object({
                name: z.string(),
                path: z.string(),
            })
            .nullable()
            .default(null),
        display: z
            .object({
                name: z.string(),
                path: z.string(),
            })
            .nullable()
            .default(null),
        preview: z
            .object({
                name: z.string(),
                path: z.string(),
            })
            .nullable()
            .default(null),
        exhibition: z
            .object({
                name: z.string(),
                path: z.string(),
            })
            .nullable()
            .default(null),
        print: z
            .object({
                name: z.string(),
                path: z.string(),
            })
            .nullable()
            .default(null),
    }),
    mediaAuxiliary: z.object({
        description: z.string().default(''),
        formats: z.object({
            arImage: z
                .object({
                    name: z.string(),
                    path: z.string(),
                })
                .nullable()
                .default(null),
            arVideo: z
                .object({
                    name: z.string(),
                    path: z.string(),
                })
                .nullable()
                .default(null),
            btsImage: z
                .object({
                    name: z.string(),
                    path: z.string(),
                })
                .nullable()
                .default(null),
            btsVideo: z
                .object({
                    name: z.string(),
                    path: z.string(),
                })
                .nullable()
                .default(null),
            codeZip: z
                .object({
                    name: z.string(),
                    path: z.string(),
                })
                .nullable()
                .default(null),
        }),
    }),
    licenses: z.object({
        nft: z.object({
            version: z.string(),
            added: z.boolean(),
            license: z.string(),
            autoStake: z.boolean().optional(),
            elastic: z.object({
                editionPrice: z.number(),
                numberOfEditions: z.number(), // TODO: Remove this field and use just availableLicenses
                totalPrice: z.number(),
                editionDiscount: z.boolean(),
            }),
            single: z.object({
                editionPrice: z.number(),
            }),
            unlimited: z.object({
                editionPrice: z.number(),
            }),
            editionOption: z.enum(['elastic', 'single', 'unlimited', '']),
            availableLicenses: z.number(),
        }),
        stream: z.object({
            version: z.string(),
            added: z.boolean(),
        }),
        print: z.object({
            version: z.string(),
            added: z.boolean(),
            unitPrice: z.number(),
            displayPrice: z.number().optional(),
            merchandisePrice: z.number().optional(),
            availableLicenses: z.number(),
        }),
        remix: z.object({
            version: z.string(),
            added: z.boolean(),
            unitPrice: z.number(),
            availableLicenses: z.number(),
        }),
        artCards: z
            .object({
                version: z.string(),
                added: z.boolean(),
                status: z
                    .enum(['pending', 'approved', 'rejected'])
                    .default('pending'),
            })
            .optional(),
    }),
    assetMetadata: z.object({
        context: z.object({
            formData: z.object({
                title: z.string(),
                description: z.string(),
                longDescription: z.string(),
                moods: z.array(z.string()),
                tags: z.array(z.string()),
                colors: ColorsSchema,
            }),
        }),
        taxonomy: z.object({
            formData: z.object({
                objectType: z.string(),
                category: z.string(),
                tags: z.array(z.string()).default([]),
                collections: z.array(z.string()).default([]),
                medium: z.array(z.string()).default([]),
                style: z.array(z.string()).default([]),
                subject: z.array(z.string()).default([]),
                aiGeneration: z.string(),
                arenabled: z.string().default('no'),
                nudity: z.string(),
            }),
        }),
        creators: z
            .object({
                formData: z.array(
                    z.object({
                        name: z.string().trim(),
                    })
                ),
            })
            .default({ formData: [] }),
    }),
    stores: z
        .object({
            visibility: z
                .enum([
                    'visibleInAllStores',
                    'visibleInSelectedStores',
                    'hiddenInSelectedStores',
                    'hiddenInAllStores',
                ])
                .default('visibleInAllStores'),
            list: z.array(z.string()).default([]),
        })
        .optional(),
    actions: ActionsSchema.optional(),
    terms: TermsSchema,
    consignArtwork: z
        .object({
            status: z.enum([
                'draft',
                'preview',
                'active',
                'hidden',
                'locked',
                'rejected',
            ]),
            listing: z.string().nullable().default(null),
            wallet: z.string().nullable().default(null),
        })
        .default({
            status: 'draft',
            listing: null,
            wallet: null,
        }),
    c2pa: z.object({
        finishedAt: z.date().nullable().default(null),
    }),
    contractExplorer: z.object({
        explorer: z.string().nullable().default(null),
        tx: z.string().nullable().default(null),
        assetId: z.number().nullable().default(null),
        assetRefId: z.number().nullable().default(null),
        creatorRefId: z.number().nullable().default(null),
        finishedAt: z.date().nullable().default(null),
    }),
    ipfs: z.object({
        // Main
        original: z.string(),
        display: z.string(),
        exhibition: z.string(),
        preview: z.string(),
        print: z.string(),
        // Auxiliary
        arImage: z.string(),
        arVideo: z.string(),
        btsImage: z.string(),
        btsVideo: z.string(),
        codeZip: z.string(),
        finishedAt: z.date().nullable().default(null),
    }),
    framework: z
        .object({
            createdAt: z.date().default(new Date()),
            updatedAt: z.date().default(new Date()),
            createdBy: z.string().nullable().default(null),
            updatedBy: z.string().nullable().default(null),
        })
        .default({}),
    creator: z.object({
        username: z.string().default(''),
    }),
});

export type Assets = z.infer<typeof AssetsSchema>;
export type AssetsDocument = Assets & { _id: string | ObjectId };
