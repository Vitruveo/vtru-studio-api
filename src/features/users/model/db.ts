import { UserSchema, UserDocument, COLLECTION_USERS } from './schema';
import type {
    UpdateUserParams,
    PushLoginHistoryParams,
    DeleteUserParams,
    FindUsersParams,
    CreateUserParams,
    FindUserByIdParams,
    FindOneUserParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';
import {
    createRecordFramework,
    updateRecordFramework,
} from '../../common/record';

const users = () => getDb().collection(COLLECTION_USERS);

// basic actions
export const createUser = async ({ user, createdBy }: CreateUserParams) => {
    const envelope = {
        ...user,
        framework: createRecordFramework({ createdBy }),
    };

    const parsed = UserSchema.parse(envelope);

    const result = await users().insertOne(parsed);
    return result;
};

// return a stream of users from database
export const findUsers = async ({
    query,
    sort,
    skip,
    limit,
}: FindUsersParams) => {
    let result = users()
        .find(query, {
            projection: {
                'login.codeHash': 0,
            },
        })
        .sort(sort)
        .skip(skip);

    if (limit) result = result.limit(limit);

    return result.stream();
};

export const findUserById = async ({ id }: FindUserByIdParams) => {
    const result = await users().findOne(
        { _id: new ObjectId(id) },
        {
            projection: {
                'login.codeHash': 0,
            },
        }
    );
    return result;
};

export const findOneUser = async ({ query }: FindOneUserParams) => {
    const result = await users().findOne<UserDocument>(query, {
        projection: {
            'login.codeHash': 0,
        },
    });
    return result;
};

export const updateUser = async ({ id, user, updatedBy }: UpdateUserParams) => {
    const envelope = {
        ...user,
        framework: updateRecordFramework({
            updatedBy,
            framework: user.framework!,
        }),
    };

    const parsed = UserSchema.parse(envelope);
    const result = await users().updateOne(
        { _id: new ObjectId(id) },
        { $set: parsed }
    );
    return result;
};

export const pushUserLoginHistory = async ({
    id,
    data,
}: PushLoginHistoryParams) => {
    const result = await users().updateOne(
        { _id: new ObjectId(id) },
        { $push: { 'login.loginHistory': data } }
    );
    return result;
};

export const deleteUser = async ({ id }: DeleteUserParams) => {
    const result = await users().deleteOne({ _id: new ObjectId(id) });
    return result;
};

// Other actions
