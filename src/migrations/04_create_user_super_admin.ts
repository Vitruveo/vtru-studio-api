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

        const createSuperAdmin = async (name: string, email: string) => {
            const user = await db.collection(COLLECTION_USERS).findOne({
                'login.email': email,
            });

            if (!user) {
                await db.collection(COLLECTION_USERS).insertOne({
                    name,
                    login: {
                        email,
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

        await Promise.all([
            createSuperAdmin('Super Admin Vitruveo', 'technology@vitruveo.xyz'),
            createSuperAdmin('Super Admin Jbtec', 'tecnologia@jbtec.com.br'),
        ]);
    }
};

export const down = async (): Promise<void> => {};
