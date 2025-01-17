import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_FEATURES = 'features';

const framework = z
    .object({
        createdAt: z.date().default(new Date()),
        updatedAt: z.date().default(new Date()),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    })
    .default({});

export const FeatureSchema = z.object({
    name: z.string().default(''),
    released: z.boolean().optional().default(false),
    isOnlyFor: z.boolean().optional(),
    onlyFor: z.enum(['allowList', 'specificUsers']).optional(),
    emails: z.array(z.string()).optional(),
    framework,
});

export type Feature = z.infer<typeof FeatureSchema>;
export type FeatureDocument = Feature & { _id: string | ObjectId };
