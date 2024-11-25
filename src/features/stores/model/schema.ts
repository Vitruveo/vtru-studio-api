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

export const FrameworkSchema = z.object({
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date()),
    createdBy: z.string().nullable().default(null),
    updatedBy: z.string().nullable().default(null),
});

export const StoreStatusEnum = z.enum(['draft', 'active', 'inactive']);

export const StoresSchema = z.object({
    organization: OrganizationSchema,
    hash: z.string().default(''),
    framework: FrameworkSchema.default({}),
    status: StoreStatusEnum.default('draft'),
    actions: z.object({ countClone: z.number().default(0) }).optional(),
});

export type Stores = z.infer<typeof StoresSchema>;
export type StoresDocument = Stores & { _id: string | ObjectId };
