import { MigrationParameters } from '@nsfilho/migration';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    // add index to assets collection
    await db.collection('assets').createIndex({ 'framework.createdBy': 1 });
};
