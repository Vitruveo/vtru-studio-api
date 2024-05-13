import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_ASSETS = 'assets';

const RGBSchema = z.array(z.number());
const HEXSchema = z.string();
const ColorSchema = z.union([RGBSchema, HEXSchema]); // TODO: CHANGE TO z.array(z.array(z.number())) AFTER MIGRATION IS DONE

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
                colors: z.array(ColorSchema),
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
            status: z.enum(['draft', 'preview', 'active', 'hidden', 'locked']),
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
});

export type Assets = z.infer<typeof AssetsSchema>;
export type AssetsDocument = Assets & { _id: string | ObjectId };
