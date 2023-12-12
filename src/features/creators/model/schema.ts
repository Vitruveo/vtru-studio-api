import { z } from 'zod';

export const COLLECTION_CREATORS = 'creators';

export const CreatorSchema = z.object({
    name: z.string().default(''),
    username: z.string().or(z.undefined()),
    login: z
        .object({
            loginHistory: z
                .array(
                    z.object({
                        ip: z.string(),
                        createdAt: z.date(),
                    })
                )
                .default([]),
        })
        .default({ loginHistory: [] }),
    emails: z
        .array(
            z.object({
                email: z.string().email(),
                codeHash: z.string().nullable().default(null),
                checkedAt: z.date().nullable().default(null),
            })
        )
        .default([]),
    wallets: z
        .array(
            z.object({
                publicId: z.string(),
            })
        )
        .default([]),
    profile: z
        .object({
            avatar: z.string().nullable().default(null),
            phone: z.string().nullable().default(null),
            language: z.string().nullable().default(null),
            location: z.string().nullable().default(null),
        })
        .default({}),
    roles: z.array(z.string()).default([]),
    framework: z
        .object({
            createdAt: z.date().default(new Date()),
            updatedAt: z.date().default(new Date()),
            createdBy: z.string().nullable().default(null),
            updatedBy: z.string().nullable().default(null),
        })
        .default({}),
});

export type Creator = z.infer<typeof CreatorSchema>;
export type CreatorDocument = Creator & { _id: string };
