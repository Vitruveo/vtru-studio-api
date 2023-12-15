import { z } from 'zod';
import { ObjectId } from '../../../services';

export const schemaParamsObjectId = {
    id: z.string().refine((val) => {
        try {
            return ObjectId.isValid(val);
        } catch (error) {
            return false;
        }
    }),
};

export const schemaParamsEmail = { email: z.string().email() };

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

export const schemaBodyEmail = z.object({ email: z.string().email() });
export const schemaBodyCode = z.object({ code: z.string() });
export const schemaBodyRequestUpload = z.object({
    mimetype: z.string(),
    userId: z.string(),
});
