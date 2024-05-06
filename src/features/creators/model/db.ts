import { CreatorDocument, COLLECTION_CREATORS } from './schema';
import type {
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
    UpdateAvatarParams,
    CheckWalletExistsParams,
    AddVideoToGalleryParams,
    FindCreatorsByName,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const creators = () => getDb().collection<CreatorDocument>(COLLECTION_CREATORS);

// basic actions
export const createCreator = async ({ creator }: CreateCreatorParams) => {
    const result = await creators().insertOne(creator);
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
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        { $set: creator }
    );
    return result;
};

export const updateCodeHashEmailCreator = async ({
    id,
    email,
    codeHash,
    checkedAt,
    framework,
}: UpdateCodeHashEmailCreatorParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id), 'emails.email': email },
        {
            $set: {
                'emails.$.codeHash': codeHash,
                'emails.$.checkedAt': checkedAt,
                framework,
            },
        }
    );
    return result;
};

export const addEmailCreator = async ({
    id,
    email,
    framework,
}: AddEmailCreatorParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $push: { emails: { email, codeHash: null, checkedAt: null } },
            $set: { framework },
        }
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

export const updateAvatar = async ({ id, fileId }: UpdateAvatarParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        { $set: { 'profile.avatar': fileId } }
    );
    return result;
};

export const checkWalletExists = async ({
    address,
}: CheckWalletExistsParams) => {
    const result = await creators().countDocuments({ wallets: { address } });
    return !!result;
};

export const addToVideoGallery = ({
    id,
    url,
    thumbnail,
    title,
}: AddVideoToGalleryParams) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $push: {
                videoGallery: {
                    url,
                    createdAt: new Date(),
                    thumbnail,
                    title,
                },
            },
        }
    );

export const findCreatorsByName = ({ name }: FindCreatorsByName) => creators().aggregate([
    {
        $match: {
            'username': {
                $regex: new RegExp(name, 'i'),
            },
        },
    },
    {
        $unwind: '$username',
    },
    {
        $group: {
            _id: '$username',
            count: { $sum: 1 },
        },
    },
    {
        $project: {
            _id: 0,
            collection: '$_id',
            count: 1,
        },
    },
]).toArray();