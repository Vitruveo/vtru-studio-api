import { z } from 'zod';
import { ColorsSchema } from '../model';

export const schemaValidationForCreate = z.object({
    cloneId: z.string().optional(),
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
    isOriginal: z.boolean().default(false),
    generatedArtworkAI: z.boolean().default(false),
    notMintedOtherBlockchain: z.boolean().default(false),
    contract: z.boolean().default(false),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaAssetUpdateStatus = z.object({
    status: z.enum(['active', 'blocked']),
});

export const schemaAssetUpdateManyStatus = z.object({
    status: z.enum(['active', 'blocked']),
    ids: z.array(z.string()),
});

export const schemaAssetUpdateManyNudity = z.object({
    nudity: z.boolean(),
    ids: z.array(z.string()),
});

export const schemaValidationForVideoGallery = z.object({
    artworks: z.array(z.string()).max(16),
    title: z.string().default(''),
    description: z.string().default(''),
    sound: z.string(),
    fees: z.number(),
    timestamp: z.string(),
});

export const schemaAssetUpload = z.object({
    formats: z.object({
        original: z
            .object({
                name: z.string(),
                path: z.string(),
                size: z.number().nullable().default(null),
                width: z.number().nullable().default(null),
                height: z.number().nullable().default(null),
                definition: z
                    .enum(['landscape', 'portrait', 'square'])
                    .nullable()
                    .default(null),
                validation: z
                    .object({
                        isValid: z.boolean(),
                        message: z.string().default(''),
                    })
                    .optional(),
            })
            .nullable()
            .default(null),
        display: z
            .object({
                name: z.string(),
                path: z.string(),
                size: z.number().nullable().default(null),
                validation: z
                    .object({
                        isValid: z.boolean(),
                        message: z.string().default(''),
                    })
                    .optional(),
            })
            .nullable()
            .default(null),
        preview: z
            .object({
                name: z.string(),
                path: z.string(),
                size: z.number().nullable().default(null),
                validation: z
                    .object({
                        isValid: z.boolean(),
                        message: z.string().default(''),
                    })
                    .optional(),
            })
            .nullable()
            .default(null),
        exhibition: z
            .object({
                name: z.string(),
                path: z.string(),
                size: z.number().nullable().default(null),
                validation: z
                    .object({
                        isValid: z.boolean(),
                        message: z.string().default(''),
                    })
                    .optional(),
            })
            .nullable()
            .default(null),
        print: z
            .object({
                name: z.string(),
                path: z.string(),
                size: z.number().nullable().default(null),
                validation: z
                    .object({
                        isValid: z.boolean(),
                        message: z.string().default(''),
                    })
                    .optional(),
            })
            .nullable()
            .default(null),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaAuxiliaryMedia = z.object({
    mediaAuxiliary: z.object({
        description: z.string().nullable().default(null),
        formats: z.object({
            arImage: z
                .object({
                    name: z.string(),
                    path: z.string(),
                    size: z.number().nullable().default(null),
                })
                .nullable()
                .default(null),
            arVideo: z
                .object({
                    name: z.string(),
                    path: z.string(),
                    size: z.number().nullable().default(null),
                })
                .nullable()
                .default(null),
            btsImage: z
                .object({
                    name: z.string(),
                    path: z.string(),
                    size: z.number().nullable().default(null),
                })
                .nullable()
                .default(null),
            btsVideo: z
                .object({
                    name: z.string(),
                    path: z.string(),
                    size: z.number().nullable().default(null),
                })
                .nullable()
                .default(null),
            codeZip: z
                .object({
                    name: z.string(),
                    path: z.string(),
                    size: z.number().nullable().default(null),
                })
                .nullable()
                .default(null),
        }),
    }),
});

export const schemaAssetArtCardsStatus = z.enum([
    'pending',
    'approved',
    'rejected',
]);

export const schemaLicenses = z.object({
    licenses: z.object({
        nft: z.object({
            version: z.string(),
            added: z.boolean(),
            license: z.string(),
            autoStake: z.boolean().optional(),
            elastic: z.object({
                editionPrice: z.number(),
                numberOfEditions: z.number(),
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
            availableLicenses: z.number().min(0).nullable().default(1), // NOTE: ESSE CAMPO É NULLABLE POR CONTA DA MIGRAÇÃO DE DADOS DO SEARCH.
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
            availableLicenses: z.number().min(0).default(1),
        }),
        remix: z
            .object({
                version: z.string(),
                added: z.boolean(),
                unitPrice: z.number(),
                availableLicenses: z.number().min(0).default(1),
            })
            .optional(),
        artCards: z
            .object({
                added: z.boolean(),
                version: z.string().default('1'),
                status: schemaAssetArtCardsStatus.default('pending'),
            })
            .optional(),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaAssetMetadata = z.object({
    assetMetadata: z.object({
        isCompleted: z.boolean(),
        context: z.object({
            formData: z
                .object({
                    title: z.string().or(z.null()),
                    description: z.string().or(z.null()),
                    longDescription: z.string().or(z.null()),
                    culture: z.string().or(z.null()),
                    mood: z.array(z.string().or(z.null())),
                    colors: ColorsSchema.or(z.null()),
                    copyright: z.string().or(z.null()),
                    orientation: z.string().or(z.null()),
                })
                .partial(),
        }),
        taxonomy: z.object({
            formData: z
                .object({
                    objectType: z.string().or(z.null()),
                    category: z.string().or(z.null()),
                    tags: z.array(z.string()).or(z.null()),
                    collections: z.array(z.string().or(z.null())),
                    medium: z.array(z.string()).or(z.null()),
                    style: z.array(z.string().or(z.null())),
                    subject: z.array(z.string().or(z.null())),
                    genre: z.string().or(z.null()),
                    aiGeneration: z.string().or(z.null()),
                    arenabled: z.string().or(z.null()),
                    nudity: z.string().or(z.null()),
                    department: z.string().or(z.null()),
                })
                .partial(),
        }),
        creators: z.object({
            formData: z.array(
                z
                    .object({
                        name: z.string().trim().or(z.null()),
                        roles: z.array(z.string().or(z.null())),
                        bio: z.string().or(z.null()),
                        birthDate: z.string().or(z.null()),
                        birthLocation: z.string().or(z.null()),
                        nationality: z.string().or(z.null()),
                        residence: z.string().or(z.null()),
                        ethnicity: z.string().or(z.null()),
                        gender: z.string().or(z.null()),
                        profileUrl: z.string().or(z.null()),
                    })
                    .partial()
            ),
        }),
        provenance: z.object({
            formData: z
                .object({
                    country: z.string().or(z.null()),
                    blockchain: z.string().or(z.null()),
                    plusCode: z.string().or(z.null()),
                    exhibitions: z.array(
                        z
                            .object({
                                exhibitionName: z.string().or(z.null()),
                                exhibitionUrl: z.string().or(z.null()),
                            })
                            .partial()
                    ),
                    awards: z.array(
                        z
                            .object({
                                awardName: z.string().or(z.null()),
                                awardUrl: z.string().or(z.null()),
                            })
                            .partial()
                    ),
                })
                .partial(),
        }),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaContract = z.object({
    isOriginal: z.boolean().default(false),
    generatedArtworkAI: z.boolean().default(false),
    notMintedOtherBlockchain: z.boolean().default(false),
    contract: z.boolean().default(false),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaPublish = z.object({
    status: z.enum(['draft', 'published', 'archived', 'preview']),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaConsignArtworkStatus = z.object({
    consignArtwork: z.object({
        status: z
            .enum(['draft', 'preview', 'active', 'hidden'])
            .default('draft'),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaConsignArtworkListing = z.object({
    consignArtwork: z.object({
        artworkListing: z
            .string()
            .nullable()
            .default(null)
            .transform((value) => (value ? new Date(value) : null)),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaConsignArtwork = z.object({
    consignArtwork: z.object({
        status: z
            .enum(['draft', 'preview', 'active', 'hidden'])
            .default('draft'),
        artworkListing: z
            .string()
            .nullable()
            .default(null)
            .transform((value) => (value ? new Date(value) : null)),
        creatorWallet: z.string().nullable().default(null),
        creatorCredits: z.number().nullable().default(null),
        creatorContract: z.date().nullable().default(null),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForDeleteFile = z.object({
    deleteKeys: z.array(z.string()),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaC2pa = z.object({
    c2pa: z.object({
        finishedAt: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: 'Must be a valid date string',
            })
            .transform((value) => new Date(value))
            .nullable()
            .default(null),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaIpfs = z.object({
    ipfs: z.object({
        finishedAt: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: 'Must be a valid date string',
            })
            .transform((value) => new Date(value))
            .nullable()
            .default(null),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaContractExplorer = z.object({
    contractExplorer: z.object({
        explorer: z.string().nullable().default(null),
        tx: z.string().nullable().default(null),
        assetId: z.number().nullable().default(null),
        assetRefId: z.number().nullable().default(null),
        creatorRefId: z.number().nullable().default(null),
        finishedAt: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: 'Must be a valid date string',
            })
            .transform((value) => new Date(value))
            .nullable()
            .default(null),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForPutStoresVisibility = z.object({
    visibility: z
        .enum([
            'visibleInAllStores',
            'visibleInSelectedStores',
            'hiddenInSelectedStores',
            'hiddenInAllStores',
        ])
        .default('visibleInAllStores'),
    list: z.array(z.string()).default([]),
});

export const schemaValidationForCreateCheckouSession = z.object({
    assetId: z.string(),
    productId: z.string(),
});

export const schemaValidationForUngroupedAssets = z.object({
    query: z.record(z.string(), z.any()).default({}),
    page: z.number().default(1),
    limit: z.number().default(10),
    minPrice: z.number().default(0),
    maxPrice: z.number().default(0),
    name: z.string().default(''),
    sort: z.object({
        order: z.string().default('latest'),
        isIncludeSold: z.boolean().default(false),
    }),
    precision: z.string().default('0.7'),
    showAdditionalAssets: z.boolean().default(false),
    hasBts: z.boolean().default(false),
    hasNftAutoStake: z.boolean().default(false),
    storesId: z.string().default(''),
});

export const schemaValidationForGroupedAssets = z.object({
    query: z.record(z.string(), z.any()).default({}),
    page: z.number().default(1),
    limit: z.number().default(10),
    minPrice: z.number().default(0),
    maxPrice: z.number().default(0),
    name: z.string().default(''),
    sort: z.object({
        order: z.string().default('latest'),
        isIncludeSold: z.boolean().default(false),
    }),
    hasBts: z.boolean().default(false),
    hasNftAutoStake: z.boolean().default(false),
    storesId: z.string().default(''),
});
