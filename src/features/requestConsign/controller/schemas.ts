import { z } from 'zod';
import { StatusSchema } from '../model';

export const schemaValidationForPatch = z.object({
    status: StatusSchema.refine((status) => status !== 'pending', {
        message: 'Status must not be pending',
    }),
    logs: z
        .array(
            z.object({
                status: z.string(),
                message: z.string(),
                when: z.string(),
            })
        )
        .optional(),
});

export const schemaValidationForPatchComments = z.object({
    comment: z.string(),
});
