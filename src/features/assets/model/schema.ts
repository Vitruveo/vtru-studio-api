import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_ASSETS = 'assets';

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
            availableLicenses: z.number(),
        }),
        remix: z.object({
            version: z.string(),
            added: z.boolean(),
            unitPrice: z.number(),
            availableLicenses: z.number(),
        }),
    }),
    assetMetadata: z.object({
        context: z.object({
            formData: z.object({
                title: z.string(),
                description: z.string(),
                longDescription: z.string(),
                moods: z.array(z.string()),
                tags: z.array(z.string()),
            }),
        }),
        creators: z
            .object({
                formData: z.array(
                    z.object({
                        name: z.string(),
                    })
                ),
            })
            .default({ formData: [] }),
    }),
    isOriginal: z.boolean().default(false),
    generatedArtworkAI: z.boolean().default(false),
    notMintedOtherBlockchain: z.boolean().default(false),
    contract: z.boolean().default(false),
    consignArtwork: z
        .object({
            status: z
                .enum([
                    'draft',
                    'preview',
                    'active',
                    'hidden',
                    'locked',
                    'processing',
                ])
                .default('draft'),
            listing: z.string().nullable().default(null),
            wallet: z.string().nullable().default(null),
            finishedAt: z.date().nullable().default(null),
        })
        .default({}),
    c2pa: z
        .object({
            finishedAt: z.date().nullable().default(null),
        })
        .default({}),
    contractExplorer: z
        .object({
            explorer: z.string().nullable().default(null),
            tx: z.string().nullable().default(null),
            assetId: z.number().nullable().default(null),
            assetRefId: z.number().nullable().default(null),
            creatorRefId: z.number().nullable().default(null),
            finishedAt: z.date().nullable().default(null),
        })
        .default({}),
    ipfs: z
        .object({
            // Main
            original: z.string().nullable().default(null),
            display: z.string().nullable().default(null),
            exhibition: z.string().nullable().default(null),
            preview: z.string().nullable().default(null),
            print: z.string().nullable().default(null),
            // Auxiliary
            arImage: z.string().nullable().default(null),
            arVideo: z.string().nullable().default(null),
            btsImage: z.string().nullable().default(null),
            btsVideo: z.string().nullable().default(null),
            codeZip: z.string().nullable().default(null),
            finishedAt: z.date().nullable().default(null),
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
