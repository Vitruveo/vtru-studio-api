/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ROLES } from '../features/roles/model/schema';
import { COLLECTION_USERS } from '../features/users/model/schema';

const framework = {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
};

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await db.collection(COLLECTION_ROLES).deleteMany({});

    const role = await db.collection(COLLECTION_ROLES).insertMany([
        {
            name: 'Super admin',
            description: 'all permissions',
            permissions: [
                'asset:admin',
                'asset:reader',
                'creator:admin',
                'creator:reader',
                'role:admin',
                'role:reader',
                'user:admin',
                'user:reader',
                'allow-list:admin',
                'allow-list:reader',
                'waiting-list:admin',
                'waiting-list:reader',
                'moderator:admin',
                'moderator:reader',
            ],
            framework,
        },
    ]);

    await db
        .collection(COLLECTION_USERS)
        .updateMany({}, { $set: { roles: [role.insertedIds[0]] } });
};
