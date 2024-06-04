import { z } from 'zod';
import { StatusSchema } from '../model';

export const schemaValidationForPatch = z.object({
    status: StatusSchema.refine((status) => status !== 'pending', {
        message: 'Status must not be pending',
    }),
});
