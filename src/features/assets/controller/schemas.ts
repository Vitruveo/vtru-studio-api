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
    contract: z.boolean().default(false),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

const schemaMetadataDefinition = z.object({
    domain: z.string().default(''),
    order: z.number().default(0),
    value: z.unknown().default(''),
    name: z.string().default(''),
    title: z.string().default(''),
    type: z.enum([
        'string',
        'date',
        'select',
        'integer',
        'cents',
        'boolean',
        'tags',
    ]),
    required: z.boolean().default(false),
    validation: z.string().default(''),
    options: z
        .array(
            z.object({
                value: z.string().default(''),
                label: z.string().default(''),
            })
        )
        .default([]),
    auto: z
        .object({
            nameTargetFieldValue: z.string().default(''),
            selectOptions: z.object({
                labelOptionField: z.array(z.string()).default([]),
                valueOptionField: z.array(z.string()).default([]),
            }),
        })
        .nullable()
        .default(null),
});

export const schemaAssetUpload = z.object({
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
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaLicenses = z.object({
    licenses: z
        .array(
            z.object({
                title: z.string().default(''),
                added: z.boolean().default(false),
                domain: z.string().default(''),
                version: z.string().default(''),
                enable: z.boolean().default(true),
                licenseMetadataDefinitions: z
                    .array(schemaMetadataDefinition)
                    .default([]),
            })
        )
        .default([]),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaAssetMetadata = z.object({
    assetMetadata: z.object({
        assetMetadataDefinitions: z.array(schemaMetadataDefinition).default([]),
        assetMetadataDomains: z
            .array(z.object({ value: z.string(), label: z.string() }))
            .default([]),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaCreatorMetadata = z.object({
    creatorMetadata: z.object({
        creatorMetadataDefinitions: z
            .array(schemaMetadataDefinition)
            .default([]),
    }),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaContract = z.object({
    contract: z.boolean().default(false),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaPublish = z.object({
    status: z.enum(['draft', 'published', 'archived']),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});
