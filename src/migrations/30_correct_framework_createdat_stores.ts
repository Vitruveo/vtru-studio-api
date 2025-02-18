/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import dayjs from 'dayjs';
import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_STORES } from '../features/stores/model';

let startDate = dayjs('2025-02-14T00:12:00.000Z');

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    try {
        const stores = await db.collection(COLLECTION_STORES).find().toArray();

        for (const store of stores) {
            startDate = startDate.add(1, 'minute');

            await db.collection(COLLECTION_STORES).updateOne(
                { _id: store._id },
                {
                    $set: {
                        moderation: {
                            owner: '',
                            createdAt: startDate.toDate(),
                        },
                    },
                }
            );
        }
    } catch (error) {
        console.log('error in migration 30', error);
        throw error;
    }
};
