import { z } from 'zod';

export const schemaValidationForCreate = z.object({
    name: z.string().min(3),
    description: z.string().default(''),
    permissions: z.array(z.string()).default([]),
});
export const schemaValidationForUpdate = z.object({
    name: z.string(),
    description: z.string().default(''),
    permissions: z.array(z.string()),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string(),
    }),
});
