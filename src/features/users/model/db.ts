import { UserDocument, COLLECTION_USERS } from './schema';
import type {
    UpdateUserParams,
    PushLoginHistoryParams,
    DeleteUserParams,
    FindUsersParams,
    CreateUserParams,
    FindUserByIdParams,
    FindOneUserParams,
    CountUsersParams,
    FindUserPaginatedParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const users = () => getDb().collection(COLLECTION_USERS);

// basic actions
export const createUser = async ({ user }: CreateUserParams) => {
    const result = await users().insertOne(user);
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

// return a list of users from database paginated
export const findUsersPaginated = async ({
    query,
    skip,
    limit,
}: FindUserPaginatedParams) =>
    await users()
        .find(query, {
            projection: {
                'login.codeHash': 0,
            },
        })
        .skip(skip)
        .limit(limit)
        .toArray();

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

export const updateUser = async ({ id, user }: UpdateUserParams) => {
    const result = await users().updateOne(
        { _id: new ObjectId(id) },
        { $set: user }
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

export const countUsers = async ({ query }: CountUsersParams) =>
    users().countDocuments(query);
