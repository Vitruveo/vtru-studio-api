import { z } from 'zod';
import { ObjectId as MongoObjectId } from '../../../services/mongo';

const ObjectId = z.instanceof(MongoObjectId);
const ISODate = z.date();
const NumberInt = z.number();

const FrameworkSchema = z.object({
    createdAt: ISODate,
    createdBy: z.string(),
    updatedAt: ISODate,
    updatedBy: ObjectId.nullable(),
});

const FormDataSchema = z.object({
    title: z.string(),
    description: z.string(),
    colors: z.array(z.array(z.number())).default([]),
    culture: z.string(),
    mood: z.array(z.string()),
    orientation: z.string(),
});

const CreatorsSchema = z.object({
    name: z.string().trim(),
    roles: z.array(z.string()).default([]),
    bio: z.string().optional(),
    nationality: z.string().optional(),
    residence: z.string().optional(),
    ethnicity: z.string().optional(),
    gender: z.string().optional(),
    profileUrl: z.string().url().optional(),
});

const TaxonomySchema = z.object({
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
});

const ProvenanceSchema = z.object({
    country: z.string().optional(),
    blockchain: z.string().optional(),
    exhibitions: z
        .array(
            z.object({
                exhibitionName: z.string().optional(),
                exhibitionUrl: z.string().url().optional(),
            })
        )
        .default([]),
    awards: z
        .array(
            z.object({
                awardName: z.string().optional(),
                awardUrl: z.string().url().optional(),
            })
        )
        .default([]),
});

export const schemaCreatorValidation = z.object({
    emails: z
        .array(
            z.object({
                email: z.string().email('Invalid email address'),
            })
        )
        .refine((emails) => emails.length > 0, {
            message: 'At least one email is required',
        }),
    wallets: z
        .array(
            z.object({
                address: z.string().refine((value) => value.length > 0, {
                    message: 'Wallet address is required',
                }),
            })
        )
        .refine((wallets) => wallets.length > 0, {
            message: 'At least one wallet is required',
        }),
    profile: z
        .object({
            avatar: z.string().nullable(),
        })
        .optional(),
    username: z.string().min(1, 'Username is required'),
});

const AssetMetadataSchema = z.object({
    isCompleted: z.boolean().default(false),
    context: z.object({
        formData: FormDataSchema,
    }),
    creators: z
        .object({
            formData: z.array(CreatorsSchema).default([]),
        })
        .default({}),
    taxonomy: z.object({
        formData: TaxonomySchema,
    }),
    provenance: z.object({
        formData: ProvenanceSchema,
    }),
});

const NFTLicenseSchema = z
    .object({
        autoStake: z.boolean().optional(),
        version: z.string(),
        added: z.boolean(),
        license: z.enum([
            'CC BY',
            'CC BY-SA',
            'CC BY-NC',
            'CC BY-NC-SA',
            'CC BY-ND',
            'CC BY-NC-ND',
            'CC0',
        ]),
        elastic: z
            .object({
                editionPrice: NumberInt,
                numberOfEditions: NumberInt,
                totalPrice: NumberInt,
                editionDiscount: z.boolean(),
                availableLicenses: z.number().min(1).default(1),
            })
            .optional(),
        single: z
            .object({
                editionPrice: NumberInt,
            })
            .optional(),
        unlimited: z
            .object({
                editionPrice: NumberInt,
            })
            .optional(),
        editionOption: z.enum(['elastic', 'single', 'unlimited']),
    })
    .refine(
        (value) => {
            if (value.editionOption === 'elastic') {
                return (
                    value.elastic &&
                    value.elastic.editionPrice > 0 &&
                    value.elastic.numberOfEditions > 0 &&
                    value.elastic.totalPrice > 0
                );
            }
            return true;
        },
        {
            message:
                'Elastic license must have editionPrice, numberOfEditions and totalPrice greater than 0.',
        }
    )
    .refine((value) => {
        if (value.editionOption === 'single') {
            return value.single && value.single.editionPrice > 0;
        }
        return true;
    })
    .refine((value) => {
        if (value.editionOption === 'unlimited') {
            return value.unlimited && value.unlimited.editionPrice > 0;
        }
        return true;
    });

const StreamLicenseSchema = z.object({
    version: z.string(),
    added: z.boolean(),
});

const PrintLicenseSchema = z
    .object({
        version: z.string(),
        added: z.boolean(),
        displayPrice: z.number(),
        merchandisePrice: z.number(),
        availableLicenses: z.number().min(1).default(1),
    })
    .refine(
        (value) => {
            if (value.added) {
                return value.displayPrice > 0 && value.merchandisePrice > 0;
            }
            return true;
        },
        {
            message: 'price must be greater than 0.',
        }
    );

const RemixLicenseSchema = z
    .object({
        version: z.string(),
        added: z.boolean(),
        unitPrice: NumberInt,
        availableLicenses: z.number().min(1).default(1),
    })
    .refine(
        (value) => {
            if (value.added) {
                return value.unitPrice > 0;
            }
            return true;
        },
        { message: 'Unit price must be greater than 0.' }
    );

const LicensesSchema = z
    .object({
        nft: NFTLicenseSchema,
        stream: StreamLicenseSchema,
        print: PrintLicenseSchema,
        remix: RemixLicenseSchema,
    })
    .refine(
        (value) =>
            // at least one license should be added
            Object.values(value).some((license) => license.added),
        {
            message: 'You must add at least one license.',
        }
    );

const OrientationSchema = z.enum(['landscape', 'portrait', 'square']);

export type Orientation = z.infer<typeof OrientationSchema>;

const FormatsSchema = z.object({
    name: z.string(),
    path: z.string(),
    // TODO: confirmar se de fato tem um BUG na rotina de upload
    size: NumberInt.nullable().optional(),
    width: NumberInt.optional(),
    height: NumberInt.optional(),
    definition: OrientationSchema.optional(),
});

const MediaAuxiliarySchema = z.object({
    description: z.string().optional(),
    formats: z
        .object({
            arImage: FormatsSchema.nullable(),
            arVideo: FormatsSchema.nullable(),
            btsImage: FormatsSchema.nullable(),
            btsVideo: FormatsSchema.nullable(),
            codeZip: FormatsSchema.nullable(),
        })
        .optional(),
});

const ConsignArtworkSchema = z.object({
    status: z.string(),
    listing: z.string().default(new Date().toISOString()),
    tokenUri: z.string().optional(),
    assetKey: z.string().optional(),
});

const AssetFormatsSchema = z
    .object({
        original: FormatsSchema,
        display: FormatsSchema,
        preview: FormatsSchema,
        exhibition: FormatsSchema,
        print: FormatsSchema.nullable(),
    })
    .refine(
        (value) =>
            value.original.path &&
            value.display.path &&
            value.preview.path &&
            value.exhibition.path,
        { message: 'All formats must have a path.' }
    );

const ContractExplorerSchemaOld = z
    .object({
        explorer: z.string().nullable().default(null),
        tx: z.string().nullable().default(null),
        assetId: z.number().nullable().default(null),
        assetRefId: z.number().nullable().default(null),
        creatorRefId: z.number().nullable().default(null),
    })
    .default({});

const ContractExplorerSchemaNew = z
    .object({
        contractAddress: z.string().nullable().default(null),
        transactionHash: z.string().nullable().default(null),
        explorerUrl: z.string().url().nullable().default(null),
        blockNumber: z.number().nullable().default(null),
        licenses: z.array(z.number()).default([]),
        createdAt: z.date().nullable().default(null),
    })
    .default({});

const ContractExplorerSchema = ContractExplorerSchemaOld.and(
    ContractExplorerSchemaNew
);

const MintExplorerSchema = z.object({
    transactionHash: z.string().nullable().default(null),
    explorerUrl: z.string().url().nullable().default(null),
    address: z.string().nullable().default(null),
    createdAt: z.date().nullable().default(null),
});

const IPFSSchema = z.record(z.string().nullable()).default({});

const C2PASchema = z
    .object({
        finishedAt: z.date().optional().nullable().default(null),
    })
    .default({});

const TermsSchema = z.object({
    isOriginal: z.boolean(),
    contract: z.boolean(),
    generatedArtworkAI: z.boolean(),
    notMintedOtherBlockchain: z.boolean(),
});

export const schemaAssetValidation = z.object({
    _id: ObjectId,
    formats: AssetFormatsSchema,
    assetMetadata: AssetMetadataSchema,
    mediaAuxiliary: MediaAuxiliarySchema.optional(),
    licenses: LicensesSchema,
    ipfs: IPFSSchema.optional(),
    c2pa: C2PASchema.optional(),
    terms: TermsSchema,
    contractExplorer: ContractExplorerSchema,
    consignArtwork: ConsignArtworkSchema.optional(),
    mintExplorer: MintExplorerSchema.optional(),
    framework: FrameworkSchema,

    // repository of media keys
    uploadedMediaKeys: z.array(z.string()),

    status: z.string(),
});

export const schemaValidationForPatchAssetPrice = z.object({
    price: z.number().min(0),
});

export const schemaValidationForPatchPrintLicensePrice = z.object({
    merchandisePrice: z.number().min(0),
    displayPrice: z.number().min(0),
});

export const schemaValidationForPatchPrintLicenseAdded = z.object({
    added: z.boolean().default(false),
});
