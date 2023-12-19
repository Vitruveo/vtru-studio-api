import { MigrationParameters } from '@nsfilho/migration';

import { COLLECTION_USERS } from '../features/users/model/schema';
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
    const roleSuperAdmin = await db.collection(COLLECTION_ROLES).findOne(
        {
            name: 'Role Super Admin',
        },
        {
            projection: {
                _id: 1,
            },
        }
    );

    if (roleSuperAdmin) {
        const roleId = roleSuperAdmin._id.toString();

        await db.collection(COLLECTION_USERS).insertOne({
            name: 'Super Admin Vitruveo',
            login: {
                email: 'technology@vitruveo.xyz',
                codeHash: null,
                loginHistory: [],
            },
            profile: {
                avatar: null,
                phone: null,
                language: null,
                location: null,
            },
            roles: [roleId],
            framework: defaultFramework,
        });

        await db.collection(COLLECTION_USERS).insertOne({
            name: 'Super Admin Jbtec',
            login: {
                email: 'tecnologia@jbtec.com.br',
                codeHash: null,
                loginHistory: [],
            },
            profile: {
                avatar: null,
                phone: null,
                language: null,
                location: null,
            },
            roles: [roleId],
            framework: defaultFramework,
        });
    }
};

export const down = async (): Promise<void> => {};
