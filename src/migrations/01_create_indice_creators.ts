import { MigrationParameters } from '@nsfilho/migration';

import { COLLECTION_CREATORS } from '../features/creators/model/schema';

/** Used to show during logs and inform what about this migration is. */
export const description = 'create indice creators';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await db
        .collection(COLLECTION_CREATORS)
        .createIndex({ username: 1 }, { unique: true, sparse: true });

    await db
        .collection(COLLECTION_CREATORS)
        .createIndex({ emails: 1 }, { unique: true, sparse: true });
};

export const down = async (): Promise<void> => {};
