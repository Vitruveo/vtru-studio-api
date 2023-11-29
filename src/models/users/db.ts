import dayjs from 'dayjs';
import { customAlphabet } from 'nanoid';
import { UserSchema, COLLECTION_USERS } from './schema';
import { encryptPassword } from './signup';
import {
    StartPasswordRecoveryParams,
    UpdateUserParams,
    DeleteUserParams,
    FindUsersParams,
    CreateUserParams,
    FindOneUserParams,
    FinishPasswordRecoveryParams,
} from './types';
import { getDb, ObjectId } from '../../services/mongo';

const users = getDb().collection(COLLECTION_USERS);

const generateToken = () =>
    `${customAlphabet('1234567890abcdef', 4)}-${customAlphabet(
        '1234567890abcdef',
        4
    )}`;

// basic actions

export const createUser = async ({ user }: CreateUserParams) => {
    const parsed = UserSchema.parse(user);
    const result = await users.insertOne(parsed);
    return result;
};

// return a stream of users from database
export const findUsers = async ({
    query,
    sort,
    skip,
    limit,
}: FindUsersParams) => {
    const result = users
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .stream();
    return result;
};

export const findOneUser = async ({ id }: FindOneUserParams) => {
    const result = await users.findOne({ _id: new ObjectId(id) });
    return result;
};

export const updateUser = async ({ id, user }: UpdateUserParams) => {
    const parsed = UserSchema.parse(user);
    const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: parsed }
    );
    return result;
};

export const deleteUser = async ({ id }: DeleteUserParams) => {
    const result = await users.deleteOne({ _id: new ObjectId(id) });
    return result;
};

// Other actions

export const startPasswordRecovery = async ({
    email,
}: StartPasswordRecoveryParams) => {
    const recoveringPassword = generateToken();
    const recoveringExpire = dayjs().add(1, 'hour').toDate();
    const result = await users.updateOne(
        { 'login.email': email },
        {
            $set: {
                'login.recoveringPassword': recoveringPassword,
                'login.recoveringExpire': recoveringExpire,
            },
        }
    );
    return {
        result,
        recoveringPassword,
        recoveringExpire,
    };
};

export const finishPasswordRecovery = async ({
    token,
    newPassword,
}: FinishPasswordRecoveryParams) => {
    const encryptedPassword = encryptPassword(newPassword);
    const result = await users.updateOne(
        {
            'login.recoveringPassword': token,
            'login.recoveringExpire': { $gt: new Date() },
        },
        {
            $set: {
                'login.password': encryptedPassword,
                'login.recoveringPassword': null,
                'login.recoveringExpire': null,
            },
        }
    );
    if (result.modifiedCount === 0) {
        throw new Error('Token expired or invalid');
    }
    return result;
};
