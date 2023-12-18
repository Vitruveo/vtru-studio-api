import { z } from 'zod';
import { ObjectId } from '../../services';

export const schemaQuery = z.object({
    sort: z
        .object({
            field: z.string(),
            order: z.number(),
        })
        .nullable()
        .default(null),
    skip: z.number().nullable().default(null),
    limit: z.number().nullable().default(null),
});

export const schemaParamsObjectId = {
    id: z.string().refine((val) => {
        try {
            return ObjectId.isValid(val);
        } catch (error) {
            return false;
        }
    }),
};

export const schemaParamsEmail = {
    email: z.string().email(),
};
