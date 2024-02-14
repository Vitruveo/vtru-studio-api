import { MigrationParameters } from '@nsfilho/migration';

import { COLLECTION_ALLOW_LIST } from '../features/allowList/model/schema';

/** Used to show during logs and inform what about this migration is. */
export const description = 'create index for allowList email';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await db
        .collection(COLLECTION_ALLOW_LIST)
        .createIndex({ email: 1 }, { unique: true, sparse: true });
};

export const down = async ({ db }: MigrationParameters): Promise<void> => {
    await db.collection(COLLECTION_ALLOW_LIST).dropIndex('email_1');
};
