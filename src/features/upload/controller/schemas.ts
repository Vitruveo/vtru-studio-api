import { z } from 'zod';

export const schemaValidationForUpload = z.object({
    url: z.string().url(),
    key: z.string(),
});

export const schemaValidationForUploadWithFile = z.object({
    key: z.string(),
});

export const schemaValidationForRequestUpload = z.object({
    assets: z.array(z.string()),
    fees: z.number(),
    metadata: z.object({}).optional(),
});
