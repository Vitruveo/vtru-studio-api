import { CreatorSchema, CreatorDocument, COLLECTION_CREATORS } from './schema';
import {
    UpdateCreatorParams,
    PushLoginHistoryParams,
    DeleteCreatorParams,
    FindCreatorsParams,
    CreateCreatorParams,
    FindCreatorByIdParams,
    FindOneCreatorParams,
    CheckUsernameExistParams,
    AddEmailParams,
    UpdateCodeHashEmailCreatorParams,
    AddEmailCreatorParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const creators = () => getDb().collection(COLLECTION_CREATORS);

// basic actions
export const createCreator = async ({ creator }: CreateCreatorParams) => {
    const parsed = CreatorSchema.parse(creator);

    const result = await creators().insertOne(parsed);
    return result;
};

// return a stream of creators from database
export const findCreators = async ({
    query,
    sort,
    skip,
    limit,
}: FindCreatorsParams) => {
    let result = creators()
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

export const findCreatorById = async ({ id }: FindCreatorByIdParams) => {
    const result = await creators().findOne(
        { _id: new ObjectId(id) },
        {
            projection: {
                'login.codeHash': 0,
            },
        }
    );
    return result;
};

export const findOneCreator = async ({ query }: FindOneCreatorParams) => {
    const result = await creators().findOne<CreatorDocument>(query, {
        projection: {
            'login.codeHash': 0,
        },
    });
    return result;
};

export const updateCreator = async ({ id, creator }: UpdateCreatorParams) => {
    const parsed = CreatorSchema.parse(creator);
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        { $set: parsed }
    );
    return result;
};

export const updateCodeHashEmailCreator = async ({
    id,
    email,
    codeHash,
    checkedAt,
}: UpdateCodeHashEmailCreatorParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id), 'emails.email': email },
        {
            $set: {
                'emails.$.codeHash': codeHash,
                'emails.$.checkedAt': checkedAt,
            },
        }
    );
    return result;
};

export const addEmailCreator = async ({ id, email }: AddEmailCreatorParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        { $push: { emails: { email, codeHash: null, checkedAt: null } } }
    );
    return result;
};

export const pushCreatorLoginHistory = async ({
    id,
    data,
}: PushLoginHistoryParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        { $push: { 'login.loginHistory': data } }
    );
    return result;
};

export const deleteCreator = async ({ id }: DeleteCreatorParams) => {
    const result = await creators().deleteOne({ _id: new ObjectId(id) });
    return result;
};

// Other actions
export const checkUsernameExist = async ({
    username,
}: CheckUsernameExistParams) => {
    const result = await creators().countDocuments({ username });
    return result;
};

export const checkEmailExist = async ({ email }: AddEmailParams) => {
    const result = await creators().countDocuments({
        emails: { $elemMatch: { email } },
    });
    return result;
};
