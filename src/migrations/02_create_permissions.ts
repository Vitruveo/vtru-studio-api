import { MigrationParameters } from '@nsfilho/migration';

import { COLLECTION_PERMISSIONS } from '../features/permissions/model/schema';

/** Used to show during logs and inform what about this migration is. */
export const description = 'create permissions';

const entities = [
    { label: 'Users', key: 'users' },
    { label: 'Creators', key: 'creators' },
    { label: 'Assets', key: 'assets' },
    { label: 'Roles', key: 'roles' },
];

const defaultFramework = {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
};

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    await Promise.all(
        entities.map(async (entity) => {
            await db.collection(COLLECTION_PERMISSIONS).insertOne({
                name: `Reader ${entity.label}`,
                key: `${entity.key}:reader`,
                framework: defaultFramework,
            });
            await db.collection(COLLECTION_PERMISSIONS).insertOne({
                name: `Admin ${entity.label}`,
                key: `${entity.key}:admin`,
                framework: defaultFramework,
            });
        })
    );

    await db.collection(COLLECTION_PERMISSIONS).insertOne({
        name: 'Super Admin',
        key: 'super-admin',
        framework: defaultFramework,
    });
};

export const down = async (): Promise<void> => {};
