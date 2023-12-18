import { z } from 'zod';

export const schemaValidationForCreate = z.object({});
export const schemaValidationForPut = z.object({
    name: z.string(),
    username: z.string(),
    profile: z.object({
        avatar: z.string().nullable().default(null),
        phone: z.string().nullable().default(null),
        language: z.string().nullable().default(null),
        location: z.string().nullable().default(null),
    }),
});
export const schemaValidationForAddEmail = z.object({
    email: z.string().email(),
});

export const emailValidation = z.string().email().min(1).max(64);

export const loginSchema = z.object({
    email: emailValidation,
});

export const otpConfirmSchema = z.object({
    email: emailValidation,
    code: z.string().length(6),
});
