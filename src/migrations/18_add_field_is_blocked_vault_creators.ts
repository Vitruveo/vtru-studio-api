/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_CREATORS } from '../features/creators/model/schema';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const creators = await db
        .collection(COLLECTION_CREATORS)
        .find({})
        .toArray();

    for (let i = 0; i < creators.length; i += 1) {
        const creator = creators[i];
        await db.collection(COLLECTION_CREATORS).updateOne(
            { _id: creator._id },
            {
                $set: {
                    vault: {
                        ...creator?.vault,
                        isBlocked: false,
                    },
                },
            }
        );
    }
};
