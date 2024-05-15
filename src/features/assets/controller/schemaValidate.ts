import { z } from 'zod';
import { ObjectId as MongoObjectId } from '../../../services';

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
});

const CreatorsSchema = z.object({
    name: z.string(),
});

const AssetMetadataSchema = z.object({
    isCompleted: z.boolean(),
    context: z.object({
        formData: FormDataSchema,
    }),
    creators: z.object({
        formData: z.array(CreatorsSchema),
    }),
    taxonomy: z
        .object({
            arenable: z.boolean().default(false),
        })
        .default({}),
});

const NFTLicenseSchema = z
    .object({
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
        unitPrice: NumberInt,
    })
    .refine(
        (value) => {
            if (value.added) {
                return value.unitPrice > 0;
            }
            return true;
        },
        {
            message: 'Unit price must be greater than 0.',
        }
    );

const RemixLicenseSchema = z
    .object({
        version: z.string(),
        added: z.boolean(),
        unitPrice: NumberInt,
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

const FormatsSchema = z.object({
    name: z.string(),
    path: z.string(),
    // TODO: confirmar se de fato tem um BUG na rotina de upload
    size: NumberInt.nullable().optional(),
    width: NumberInt.optional(),
    height: NumberInt.optional(),
    definition: z.string().optional(),
});

const MediaAuxiliarySchema = z.object({
    description: z.string().optional(),
    formats: z.object({
        arImage: FormatsSchema.nullable(),
        arVideo: FormatsSchema.nullable(),
        btsImage: FormatsSchema.nullable(),
        btsVideo: FormatsSchema.nullable(),
        codeZip: FormatsSchema.nullable(),
    }),
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

export const schemaAssetValidation = z.object({
    _id: ObjectId,
    status: z.string(),
    framework: FrameworkSchema,
    assetMetadata: AssetMetadataSchema,
    licenses: LicensesSchema,
    contract: z.boolean(),
    generatedArtworkAI: z.boolean(),
    isOriginal: z.boolean(),
    notMintedOtherBlockchain: z.boolean(),
    uploadedMediaKeys: z.array(z.string()),
    formats: AssetFormatsSchema,
    mediaAuxiliary: MediaAuxiliarySchema.optional(),
});

export type SchemaAssetValidation = z.infer<typeof schemaAssetValidation>;
