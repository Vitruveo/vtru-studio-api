import { z } from 'zod';

export const COLLECTION_PERMISSIONS = 'permissions';

export const PermissionSchema = z.object({
    name: z.string().min(3),
    key: z.string(),
    framework: z
        .object({
            createdAt: z.date().default(new Date()),
            updatedAt: z.date().default(new Date()),
            createdBy: z.string().nullable().default(null),
            updatedBy: z.string().nullable().default(null),
        })
        .default({}),
});

export type Permission = z.infer<typeof PermissionSchema>;
export type PermissionDocument = Permission & { _id: string };
