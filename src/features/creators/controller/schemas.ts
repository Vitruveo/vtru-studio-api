import { z } from 'zod';

export const schemaValidationForCreate = z.object({});
export const schemaValidationForPut = z.object({
    name: z.string(),
    walletDefault: z.string(),
    emailDefault: z.string().email(),
    username: z.string(),
    wallets: z.array(
        z.object({
            address: z.string(),
        })
    ),
    emails: z
        .array(
            z.object({
                email: z.string().email(),
                codeHash: z.string().nullable().default(null),
                checkedAt: z.string().nullable().default(null),
            })
        )
        .default([]),
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
    creators: z
        .object({
            name: z.string().or(z.null()),
            roles: z.array(z.string().or(z.null())),
            bio: z.string().or(z.null()),
            birthDate: z.string().or(z.null()),
            birthLocation: z.string().or(z.null()),
            nationality: z.string().or(z.null()),
            residence: z.string().or(z.null()),
            ethnicity: z.string().or(z.null()),
            gender: z.string().or(z.null()),
            profileUrl: z.string().or(z.null()),
        })
        .partial(),
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

export const schemaValidationForPutAvatar = z.object({
    fileId: z.string(),
    framework: z.object({
        createdAt: z.date(),
        createdBy: z.string(),
        updatedAt: z.date().default(new Date()),
        updatedBy: z.string().nullable().default(null),
    }),
});

export const schemaValidationForRequestConnect = z.object({
    wallet: z.string().min(3).max(255),
});
