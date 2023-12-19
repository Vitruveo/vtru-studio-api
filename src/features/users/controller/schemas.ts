import { z } from 'zod';

export const schemaValidationForCreate = z.object({
    name: z.string().default(''),
    login: z.object({
        email: z.string().email().min(1).max(64),
    }),
});
export const schemaValidationForUpdate = z.object({
    name: z.string().default(''),
    profile: z
        .object({
            avatar: z.string().nullable().default(null),
            phone: z.string().nullable().default(null),
            language: z.string().nullable().default(null),
            location: z.string().nullable().default(null),
        })
        .default({}),
    roles: z.array(z.string()).default([]),
    framework: z.object({
        createdAt: z.string(),
        updatedAt: z.string(),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const emailValidation = z.string().email().min(1).max(64);

export const loginSchema = z.object({
    email: emailValidation,
});

export const otpConfirmSchema = z.object({
    email: emailValidation,
    code: z.string().length(6),
});
