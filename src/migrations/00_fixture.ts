import { createHash } from 'crypto';
import { MigrationParameters } from '@nsfilho/migration';
import { PASSWORD_SALT } from '../constants';
import { COLLECTION_USERS, UserSchema } from '../models/users/schema';

/** Used to show during logs and inform what about this migration is. */
export const description = 'Initial migration';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const sha256 = createHash('sha256');
    const encryptedPassword = sha256
        .update('12345678')
        .update(PASSWORD_SALT)
        .digest('hex');

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
};

export const down = async ({
    collections,
}: MigrationParameters): Promise<void> => {
    // a piece of code for down (not implemented yet!)
    if (collections.users) {
        await collections.users.drop();
    }
};
