import { z } from 'zod';
import { ObjectId } from '../../../services';

export const COLLECTION_WAITING_LIST = 'waitingList';

const framework = z
    .object({
        createdAt: z.date().default(new Date()),
        updatedAt: z.date().default(new Date()),
        createdBy: z.string().nullable().default(null),
        updatedBy: z.string().nullable().default(null),
    })
    .default({});

export const WaitingListSchema = z.object({
    attempts: z.number().default(0),
    attemptDates: z.array(z.date()).default([]),
    email: z.string().default(''),
    framework,
});

export type WaitingList = z.infer<typeof WaitingListSchema>;
export type WaitingListDocument = WaitingList & { _id: string | ObjectId };
