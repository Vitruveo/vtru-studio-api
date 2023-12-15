import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_ROLES = 'roles';

export const RoleSchema = z.object({
    name: z.string().min(3),
    description: z.string().default(''),
    permissions: z.array(z.string()).default([]),
    framework: z
        .object({
            createdAt: z.date().default(new Date()),
            updatedAt: z.date().default(new Date()),
            createdBy: z.string().nullable().default(null),
            updatedBy: z.string().nullable().default(null),
        })
        .default({}),
});

export type Role = z.infer<typeof RoleSchema>;
export type RoleDocument = Role & { _id: string | ObjectId };
