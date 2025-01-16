import { z } from 'zod';

export const schemaValidationForCreate = z.object({
    name: z.string(),
    framework: z.object({
        createdAt: z.string().or(z.date()).nullable().default(null),
        updatedAt: z.string().or(z.date()).nullable().default(null),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForUpdate = z.object({
    name: z.string(),
    released: z.boolean().optional(),
    isOnlyFor: z.boolean().optional(),
    onlyFor: z.enum(['allowList', 'specificUsers']).optional(),
    emails: z.array(z.string()).optional(),
    framework: z.object({
        createdAt: z.string().or(z.date()).nullable().default(null),
        updatedAt: z.string().or(z.date()).nullable().default(null),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForAdd = z.object({
    name: z.string(),
});
