import { MigrationParameters } from '@nsfilho/migration';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    // add index to request consigns collection
    await db.collection('requestConsigns').createIndex({ status: 1 });
};
