import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_STORES } from '../features/stores/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    try {
        await db
            .collection(COLLECTION_STORES)
            .updateMany({}, { $set: { status: 'draft' } });
    } catch (error) {
        console.log('error in migration 28', error);
        throw error;
    }
};
