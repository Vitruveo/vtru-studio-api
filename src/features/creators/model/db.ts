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
    updateCreatorSearchVideoParams,
    UpdateCreatorSocialById,
    RemoveCreatorSocialById,
    PpdateCreatorSearchGridParams,
    FindCreatorAssetsByGridId,
    FindCreatorAssetsByVideoId,
    FindCreatorAssetsBySlideshowId,
    UpdateCreatorSearchSlideshowParams,
    FindCreatorsStacksParams,
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
    id,
}: CheckWalletExistsParams) => {
    const result = await creators().countDocuments({
        _id: { $ne: new ObjectId(id) },
        'wallets.address': address,
    });
    return !!result;
};

export const updateCreatorSearchVideo = ({
    id,
    video,
}: updateCreatorSearchVideoParams) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $push: {
                'search.video': {
                    ...video,
                    createdAt: new Date(),
                },
            },
        }
    );

export const updateCreatorSocialById = ({
    id,
    key,
    value,
}: UpdateCreatorSocialById) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                [`socials.${key}`]: value,
            },
        }
    );

export const updateCreatorSearchGrid = ({
    id,
    grid,
}: PpdateCreatorSearchGridParams) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $push: {
                'search.grid': {
                    ...grid,
                    createdAt: new Date(),
                },
            },
        }
    );

export const updateCreatorSearchSlideshow = ({
    id,
    slideshow,
}: UpdateCreatorSearchSlideshowParams) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $push: {
                'search.slideshow': {
                    ...slideshow,
                    createdAt: new Date(),
                },
            },
        }
    );

export const findCreatorAssetsByGridId = async ({
    id,
}: FindCreatorAssetsByGridId) =>
    creators().findOne(
        { 'search.grid.id': id },
        { projection: { 'search.grid.$': 1 } }
    );

export const findCreatorAssetsByVideoId = async ({
    id,
}: FindCreatorAssetsByVideoId) =>
    creators().findOne(
        { 'search.video.id': id },
        { projection: { 'search.video.$': 1 } }
    );

export const findCreatorAssetsBySlideshowId = async ({
    id,
}: FindCreatorAssetsBySlideshowId) =>
    creators().findOne(
        { 'search.slideshow.id': id },
        { projection: { 'search.slideshow.$': 1 } }
    );

export const removeCreatorSocialById = ({ id, key }: RemoveCreatorSocialById) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $unset: {
                [`socials.${key}`]: '',
            },
        }
    );

export const countAllCreators = async () =>
    getDb().collection(COLLECTION_CREATORS).countDocuments();

export const findCreatorsStacks = async ({
    query,
    skip,
    limit,
    sort,
}: FindCreatorsStacksParams) => {
    const inputReducer = [
        {
            $map: {
                input: {
                    $ifNull: ['$search.slideshow', []],
                },
                as: 'item',
                in: {
                    $mergeObjects: ['$$item', { type: 'slideshow' }],
                },
            },
        },
        {
            $map: {
                input: {
                    $ifNull: ['$search.grid', []],
                },
                as: 'item',
                in: {
                    $mergeObjects: ['$$item', { type: 'grid' }],
                },
            },
        },
        {
            $map: {
                input: {
                    $ifNull: ['$search.video', []],
                },
                as: 'item',
                in: {
                    $mergeObjects: ['$$item', { type: 'video' }],
                },
            },
        },
    ];
    const stages = [
        { $match: query },
        {
            $project: {
                _id: 1,
                username: 1,
                stacks: {
                    $reduce: {
                        input: inputReducer,
                        initialValue: [],
                        in: {
                            $concatArrays: ['$$value', '$$this'],
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                'stacks.quantity': { $size: '$stacks' },
            },
        },
        { $unwind: '$stacks' },
        {
            $set: {
                'stacks.assets': {
                    $cond: {
                        if: {
                            $isArray: '$stacks.assets',
                        },
                        then: {
                            $map: {
                                input: '$stacks.assets',
                                as: 'assetId',
                                in: { $toObjectId: '$$assetId' },
                            },
                        },
                        else: [],
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'stacks.assets',
                foreignField: '_id',
                as: 'assetDetails',
            },
        },
        {
            $project: {
                _id: 1,
                username: 1,
                stacks: 1,
                assetDetails: {
                    $map: {
                        input: '$assetDetails',
                        as: 'asset',
                        in: {
                            preview: '$$asset.formats.preview.path',
                        },
                    },
                },
            },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
    ];

    return creators().aggregate(stages).toArray();
};

export const countCreatorStacks = async ({
    query,
}: Pick<FindCreatorsStacksParams, 'query'>) => {
    const inputReducer = [
        {
            $map: {
                input: {
                    $ifNull: ['$search.slideshow', []],
                },
                as: 'item',
                in: {
                    $mergeObjects: ['$$item', { type: 'slideshow' }],
                },
            },
        },
        {
            $map: {
                input: {
                    $ifNull: ['$search.grid', []],
                },
                as: 'item',
                in: {
                    $mergeObjects: ['$$item', { type: 'grid' }],
                },
            },
        },
        {
            $map: {
                input: {
                    $ifNull: ['$search.video', []],
                },
                as: 'item',
                in: {
                    $mergeObjects: ['$$item', { type: 'video' }],
                },
            },
        },
    ];
    const stages = [
        { $match: query },
        {
            $project: {
                _id: 1,
                username: 1,
                stacks: {
                    $reduce: {
                        input: inputReducer,
                        initialValue: [],
                        in: {
                            $concatArrays: ['$$value', '$$this'],
                        },
                    },
                },
            },
        },
        { $unwind: '$stacks' },
    ];

    return (await creators().aggregate(stages).toArray()).length;
};
