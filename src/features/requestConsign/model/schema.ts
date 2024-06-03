import { z } from 'zod';

export const COLLECTION_REQUEST_CONSIGNS = 'requestConsigns';

export const RequestConsignSchema = z.object({
    asset: z.string(),
    creator: z.string(),
    when: z.date().default(() => new Date()),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export type RequestConsign = z.infer<typeof RequestConsignSchema>;
export type RequestConsignDocument = RequestConsign & { _id: string };
