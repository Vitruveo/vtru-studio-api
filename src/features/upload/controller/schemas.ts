import { z } from 'zod';

export const schemaValidationForUpload = z.object({
    url: z.string().url(),
    key: z.string(),
});

export const schemaValidationForUploadWithFile = z.object({
    key: z.string(),
});
