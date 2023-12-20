import { z } from 'zod';

export const schemaValidationForCreate = z.object({});
export const schemaValidationForPut = z.object({
    name: z.string(),
    username: z.string(),
    wallets: z.array(
        z.object({
            address: z.string(),
            network: z.object({
                name: z.string(),
                chainId: z.number(),
            }),
        })
    ),
    profile: z.object({
        avatar: z.string().nullable().default(null),
        phone: z.string().nullable().default(null),
        language: z.string().nullable().default(null),
        location: z.string().nullable().default(null),
    }),
    framework: z.object({
        createdAt: z.string().nullable(),
        createdBy: z.string().nullable(),
        updatedAt: z.string().nullable(),
        updatedBy: z.string().nullable(),
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
