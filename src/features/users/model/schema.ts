import { z } from 'zod';

export const COLLECTION_USERS = 'users';

export const UserSchema = z.object({
    name: z.string().default(''),
    login: z.object({
        email: z.string().email(),
        codeHash: z.string().nullable().default(null),
        loginHistory: z
            .array(
                z.object({
                    ip: z.string(),
                    createdAt: z.date(),
                })
            )
            .default([]),
    }),
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

export type User = z.infer<typeof UserSchema>;
export type UserDocument = User & { _id: string };
