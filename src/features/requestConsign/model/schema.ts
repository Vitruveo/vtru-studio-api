import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const COLLECTION_REQUEST_CONSIGNS = 'requestConsigns';

export const StatusSchema = z
    .enum([
        'pending',
        'approved',
        'rejected',
        'error',
        'running',
        'queue',
        'draft',
    ])
    .default('pending');

export const RequestConsignSchema = z.object({
    asset: z.string(),
    creator: z.string(),
    when: z.date().default(() => new Date()),
    status: StatusSchema,
    logs: z
        .array(
            z.object({
                status: z.string(),
                message: z.string(),
                when: z.date(),
            })
        )
        .default([]),
    comments: z
        .array(
            z.object({
                id: z.string().default(new ObjectId().toString()),
                username: z.string(),
                comment: z.string(),
                when: z.string().default(() => new Date().toISOString()),
                isPublic: z.boolean().default(false),
            })
        )
        .default([]),
});

export type RequestConsign = z.infer<typeof RequestConsignSchema>;
export type RequestConsignDocument = RequestConsign & { _id: string };
export type Status = z.infer<typeof StatusSchema>;
