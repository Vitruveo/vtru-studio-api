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
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaAuxiliaryMedia = z.object({
    mediaAuxiliary: z.object({
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
});

export const schemaLicenses = z.object({
    licenses: z.object({
        nft: z.object({
            version: z.string(),
            added: z.boolean(),
            license: z.string(),
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
        }),
        stream: z.object({
            version: z.string(),
            added: z.boolean(),
        }),
        print: z.object({
            version: z.string(),
            added: z.boolean(),
            unitPrice: z.number(),
        }),
        remix: z.object({
            version: z.string(),
            added: z.boolean(),
            unitPrice: z.number(),
        }),
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
                    title: z.string(),
                    description: z.string(),
                    culture: z.string(),
                    mood: z.array(z.string()),
                    colors: z.array(z.string()),
                    copyright: z.string(),
                    orientation: z.string(),
                })
                .partial(),
        }),
        taxonomy: z.object({
            formData: z
                .object({
                    objectType: z.string(),
                    category: z.string(),
                    tags: z.array(z.string()),
                    collections: z.array(z.string()),
                    medium: z.array(z.string()),
                    style: z.array(z.string()),
                    subject: z.array(z.string()),
                    genre: z.string(),
                    aiGeneration: z.string(),
                    arenabled: z.string(),
                    nudity: z.string(),
                    department: z.string(),
                })
                .partial(),
        }),
        creators: z.object({
            formData: z.array(
                z
                    .object({
                        name: z.string(),
                        roles: z.array(z.string()),
                        bio: z.string(),
                        birthDate: z.string(),
                        birthLocation: z.string(),
                        nationality: z.string(),
                        residence: z.string(),
                        ethnicity: z.string(),
                        gender: z.string(),
                        profileUrl: z.string(),
                    })
                    .partial()
            ),
        }),
        provenance: z.object({
            formData: z
                .object({
                    country: z.string(),
                    blockchain: z.string(),
                    plusCode: z.string(),
                    exhibitions: z.array(
                        z.object({
                            exhibitionName: z.string(),
                            exhibitionUrl: z.string(),
                        })
                    ),
                    awards: z.array(
                        z.object({
                            awardName: z.string(),
                            awardUrl: z.string(),
                        })
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

export const schemaValidationForDeleteFile = z.object({
    deleteKeys: z.array(z.string()),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});
