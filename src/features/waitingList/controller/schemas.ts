import { z } from 'zod';

export const schemaValidationForCreate = z.object({
    email: z.string().email(),
    framework: z.object({
        createdAt: z.string().or(z.date()).nullable().default(null),
        updatedAt: z.string().or(z.date()).nullable().default(null),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForCreateMultiple = z.array(
    schemaValidationForCreate
);

export const schemaValidationForUpdate = z.object({
    email: z.string().email(),
    framework: z.object({
        createdAt: z.string().or(z.date()).nullable().default(null),
        updatedAt: z.string().or(z.date()).nullable().default(null),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForAdd = z.object({
    email: z.string().email(),
});

export const emailValidation = z.string().email().min(1).max(64);
