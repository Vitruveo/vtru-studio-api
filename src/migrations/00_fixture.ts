import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_USERS, UserSchema } from '../features/users/model/schema';
import { encryptPassword } from '../features/users/model/signup';

/** Used to show during logs and inform what about this migration is. */
export const description = 'Initial migration';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const encryptedPassword = encryptPassword('12345678');
    const admin = UserSchema.parse({
        name: 'JBtec Admin',
        login: {
            email: 'tecnologia@jbtec.com.br',
            password: encryptedPassword,
            passwordHistory: [],
            loginHistory: [],
            recoveringPassword: null,
            recoveringExpire: null,
            forceChangePassword: false,
        },
        roles: ['admin'],
        framework: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
        },
    });

    await db.collection(COLLECTION_USERS).insertOne(admin);
    await db
        .collection(COLLECTION_USERS)
        .createIndex({ 'login.email': 1 }, { unique: true });
};

export const down = async ({
    collections,
}: MigrationParameters): Promise<void> => {
    // a piece of code for down (not implemented yet!)
    if (collections.users) {
        await collections.users.drop();
    }
};
