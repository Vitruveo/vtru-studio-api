import { z } from 'zod';

export const schemaValidationForCreate = z.object({});
export const schemaValidationForPut = z.object({
    name: z.string(),
    walletDefault: z.string(),
    emailDefault: z.string().email(),
    username: z.string().trim(),
    wallets: z.array(
        z.object({
            address: z.string(),
            archived: z.boolean(),
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
    synaps: z
        .object({
            sessionId: z.string().nullable().default(null),
            status: z.enum([
                'SUBMISSION_REQUIRED',
                'APPROVED',
                'PENDING_VERIFICATION',
            ]),
            steps: z
                .array(
                    z.object({
                        id: z.string(),
                        name: z.enum([
                            'LIVENESS',
                            'ID_DOCUMENT',
                            'PROOF_OF_ADDRESS',
                            'PHONE',
                        ]),
                        status: z.enum([
                            'SUBMISSION_REQUIRED',
                            'PENDING_VERIFICATION',
                            'APPROVED',
                            'REJECTED',
                        ]),
                    })
                )
                .nullable()
                .default([]),
        })
        .optional(),
    truLevel: z
        .object({
            currentLevel: z.number(),
            totalPoints: z.number(),
            extraPoints: z.number(),
            levels: z.array(
                z.object({
                    id: z.string(),
                    items: z.array(
                        z.object({
                            label: z.string(),
                            points: z.number().optional(),
                            completed: z.boolean(),
                        })
                    ),
                })
            ),
        })
        .optional(),
    myWebsite: z
        .string()
        .url()
        .nullable()
        .default(null)
        .transform((val) => (val === '' ? null : val)),
    links: z
        .array(
            z.object({
                name: z.string(),
                url: z.string().url(),
            })
        )
        .nullable()
        .default([]),
    personalDetails: z
        .object({
            bio: z.string().nullable().default(null),
            ethnicity: z.string().nullable().default(null),
            gender: z.string().nullable().default(null),
            nationality: z.string().nullable().default(null),
            residence: z.string().nullable().default(null),
            plusCode: z.string().nullable().default(null),
        })
        .nullable()
        .default({}),
    artworkRecognition: z
        .object({
            exhibitions: z
                .array(
                    z.object({
                        name: z.string(),
                        url: z.string().url(),
                        artwork: z.object({
                            type: z.enum(['assetRef', 'upload']),
                            value: z.string().nullable().default(null),
                            title: z.string().nullable().optional(),
                        }),
                    })
                )
                .nullable()
                .default([]),
            awards: z
                .array(
                    z.object({
                        name: z.string(),
                        url: z.string().url(),
                        artwork: z.object({
                            type: z.enum(['assetRef', 'upload']),
                            value: z.string().nullable().default(null),
                            title: z.string().nullable().optional(),
                        }),
                    })
                )
                .nullable()
                .default([]),
        })
        .nullable()
        .default({}),
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

export const schemaValidationForGenerateStackSlideshow = z.object({
    assets: z.array(z.string()),
    title: z.string(),
    fees: z.number(),
    display: z.string(),
    interval: z.number(),
    description: z.string().default(''),
});

export const updateLicenseSchema = z.object({
    license: z.string(),
    value: z.number(),
});
