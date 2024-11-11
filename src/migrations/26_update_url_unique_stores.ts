/* eslint-disable no-await-in-loop */
import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_STORES } from '../features/stores/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await db
        .collection(COLLECTION_STORES)
        .createIndex({ 'organization.url': 1 }, { unique: true });
};
