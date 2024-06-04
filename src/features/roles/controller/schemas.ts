import { z } from 'zod';
import { permissionsSchema } from '../model';

export const schemaValidationForCreate = z.object({
    name: z.string().min(3),
    description: z.string().default(''),
    permissions: permissionsSchema.default([]),
});
export const schemaValidationForUpdate = z.object({
    name: z.string(),
    description: z.string().default(''),
    permissions: permissionsSchema.default([]),
});
