import { z } from 'zod';

export const schemaValidationForPatch = z.object({
    status: z.enum(['approved', 'rejected']),
});
