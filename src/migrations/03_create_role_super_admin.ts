import { MigrationParameters } from '@nsfilho/migration';

import { COLLECTION_PERMISSIONS } from '../features/permissions/model/schema';
import { COLLECTION_ROLES } from '../features/roles/model/schema';

/** Used to show during logs and inform what about this migration is. */
export const description = 'create permissions';

const defaultFramework = {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
};

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const permission = await db.collection(COLLECTION_PERMISSIONS).findOne(
        {
            key: 'super-admin',
        },
        {
            projection: {
                _id: 1,
                key: 1,
            },
        }
    );

    if (permission) {
        await db.collection(COLLECTION_ROLES).insertOne({
            name: 'Role Super Admin',
            description: '',
            permissions: [permission._id],
            framework: defaultFramework,
        });
    }
};

export const down = async (): Promise<void> => {};
