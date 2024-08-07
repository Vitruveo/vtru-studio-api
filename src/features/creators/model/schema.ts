import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_CREATORS = 'creators';

export const CreatorSchema = z.object({
    creatorRefId: z.number().nullable().default(null),
    name: z.string().default(''),
    username: z.string().trim().or(z.undefined()),
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
                checkedAt: z.string().nullable().default(null),
            })
        )
        .default([]),
    wallets: z
        .array(
            z.object({
                address: z.string(),
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
    socials: z
        .object({
            x: z.object({
                name: z.string().nullable().default(null),
                avatar: z.string().nullable().default(null),
            }),
            facebook: z.object({
                name: z.string().nullable().default(null),
                avatar: z.string().nullable().default(null),
            }),
            google: z.object({
                name: z.string().nullable().default(null),
                avatar: z.string().nullable().default(null),
            }),
        })
        .default({
            x: { name: null, avatar: null },
            facebook: { name: null, avatar: null },
            google: { name: null, avatar: null },
        }),
    roles: z.array(z.string()).default([]),
    walletDefault: z.string().default(''),
    vault: z
        .object({
            transactionHash: z.string().nullable().default(null),
            vaultAddress: z.string().nullable().default(null),
            createdAt: z.date().nullable().default(null),
        })
        .default({
            transactionHash: null,
            vaultAddress: null,
            createdAt: null,
        }),
    videoGallery: z
        .array(
            z.object({
                url: z.string(),
                createdAt: z.date().default(new Date()),
                thumbnail: z.string().nullable().default(null),
                title: z.string().default(''),
            })
        )
        .default([]),
    framework: z
        .object({
            createdAt: z.date().default(new Date()),
            updatedAt: z.date().default(new Date()),
            createdBy: z.string().nullable().default(null),
            updatedBy: z.string().nullable().default(null),
        })
        .default({}),
    search: z
        .object({
            grid: z.array(
                z.object({
                    id: z.string(),
                    path: z.string(),
                    assets: z.array(z.string()).default([]),
                    createdAt: z.date().default(new Date()),
                })
            ),
            video: z.array(
                z.object({
                    id: z.string(),
                    url: z.string(),
                    thumbnail: z.string().nullable(),
                    title: z.string(),
                    sound: z.string(),
                    fees: z.number(),
                    assets: z.array(z.string()),
                })
            ),
        })
        .optional(),
});

export type Creator = z.infer<typeof CreatorSchema>;
export type CreatorDocument = Creator & { _id: string | ObjectId };
