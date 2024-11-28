import { z } from 'zod';

export const schemaValidationForUpload = z.object({
    url: z.string().url(),
    key: z.string(),
});

export const schemaValidationForUploadWithFile = z.object({
    key: z.string(),
});

export const schemaValidationForRequestUpload = z.object({
    assetsId: z.array(z.string()),
    assets: z.array(z.string()),
    description: z.string().default(''),
    fees: z.number(),
    title: z.string(),
    size: z.number(),
    hash: z.string(),
});
