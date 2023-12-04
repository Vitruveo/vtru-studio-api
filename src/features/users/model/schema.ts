import { z } from 'zod';

export const COLLECTION_USERS = 'users';

export const UserSchema = z.object({
    name: z.string().min(3),
    login: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        passwordHistory: z
            .array(
                z.object({
                    password: z.string(),
                    createdAt: z.date(),
                })
            )
            .default([]),
        loginHistory: z
            .array(
                z.object({
                    ip: z.string(),
                    createdAt: z.date(),
                })
            )
            .default([]),
        recoveringPassword: z.string().nullable().default(null),
        recoveringExpire: z.date().nullable().default(null),
        forceChangePassword: z.boolean().default(false),
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
