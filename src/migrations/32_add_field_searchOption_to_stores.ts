import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_STORES } from '../features/stores/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    try {
        // add field searchOption to stores
        await db.collection(COLLECTION_STORES).updateMany(
            {},
            {
                $set: {
                    'artworks.searchOption': 'filter',
                },
            }
        );
    } catch (error) {
        console.log('error in migration 31', error);
        throw error;
    }
};
