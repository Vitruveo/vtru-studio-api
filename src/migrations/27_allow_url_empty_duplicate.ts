import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_STORES } from '../features/stores/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    try {
        const indexes = await db.collection(COLLECTION_STORES).indexes();
        const indexExists = indexes.some(
            (index) => index.name === 'organization.url_1'
        );

        if (indexExists) {
            await db
                .collection(COLLECTION_STORES)
                .dropIndex('organization.url_1');
        }

        await db.collection(COLLECTION_STORES).createIndex(
            { 'organization.url': 1 },
            {
                unique: true,
                partialFilterExpression: {
                    'organization.url': { $exists: true, $type: 'string' },
                },
            }
        );
    } catch (error) {
        console.log('error in migration 27', error);
        throw error;
    }
};
