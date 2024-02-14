import { MigrationParameters } from '@nsfilho/migration';

import { COLLECTION_WAITING_LIST } from '../features/waitingList/model/schema';

/** Used to show during logs and inform what about this migration is. */
export const description = 'create index for waitingList email';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await db
        .collection(COLLECTION_WAITING_LIST)
        .createIndex({ email: 1 }, { unique: true, sparse: true });
};

export const down = async ({ db }: MigrationParameters): Promise<void> => {
    await db.collection(COLLECTION_WAITING_LIST).dropIndex('email_1');
};
