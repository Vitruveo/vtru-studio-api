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
    UpdateCreatorSearchGridParams,
    FindCreatorAssetsByGridId,
    FindCreatorAssetsByVideoId,
    FindCreatorAssetsBySlideshowId,
    UpdateCreatorSearchSlideshowParams,
    FindCreatorsStacksParams,
    FindCreatorByUsernameParams,
    CountAllStacksParams,
    UpdateManyStackSpotlight,
    FindArtistsForSpotlightParams,
    FilterArtistsWithConsignParams,
    MarkArtistWithFlagParams,
    ChangeStepsSynapsParams,
    SynapsSessionInitParams,
    ChangeTruLevelParams,
    CheckHashAlreadyExistsParams,
    FindTruLevelParams,
    UpdateLicenseParams,
    CountCreatorsParams,
    UpdateAutoStakeParams,
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

// return a list of creators from database paginated
export const findCreatorsPaginated = async ({
    query,
    skip,
    limit,
}: FindCreatorsParams) =>
    creators()
        .find(query, {
            projection: {
                'login.codeHash': 0,
            },
        })
        .skip(skip)
        .limit(limit)
        .toArray();

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
        {
            _id: new ObjectId(id),
            'emails.email': new RegExp(`^${email}$`, 'i'),
        },
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

export const updateAutoStake = async ({
    id,
    autoStake,
}: UpdateAutoStakeParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        { $set: { autoStake } }
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
    hash,
}: UpdateCreatorSearchGridParams) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $push: {
                'search.grid': {
                    ...grid,
                    createdAt: new Date(),
                    hash,
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

export const countAllCreators = async (query = {}) =>
    getDb().collection(COLLECTION_CREATORS).countDocuments(query);

export const countAllStacks = async ({ type }: CountAllStacksParams) =>
    creators()
        .aggregate([
            {
                $match: {
                    search: { $exists: true },
                },
            },
            {
                $project: {
                    stack: {
                        $size: { $ifNull: [`$search.${type}`, []] },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalStacks: { $sum: '$stack' },
                },
            },
        ])
        .toArray()
        .then((result) => result[0]?.totalStacks || 0);

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
                vault: 1,
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
            $match: {
                'stacks.title': { $exists: true, $ne: null, $nin: [''] },
                $or: [
                    { 'stacks.enable': { $exists: false } },
                    { 'stacks.enable': true },
                ],
            },
        },
        {
            $project: {
                _id: 1,
                username: 1,
                stacks: 1,
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
        {
            $match: {
                'stacks.title': { $exists: true, $ne: null, $nin: [''] },
                $or: [
                    { 'stacks.enable': { $exists: false } },
                    { 'stacks.enable': true },
                ],
            },
        },
    ];

    return (await creators().aggregate(stages).toArray()).length;
};

export const findCreatorByUsername = async ({
    username,
}: FindCreatorByUsernameParams) => creators().findOne({ username });

export const findStacksSpotlight = async ({
    query,
    limit,
}: Pick<FindCreatorsStacksParams, 'query' | 'limit'>) => {
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
        {
            $match: {
                'stacks.title': { $exists: true, $ne: null, $nin: [''] },
                $or: [
                    { 'stacks.enable': { $exists: false } },
                    { 'stacks.enable': true },
                ],
                'stacks.displaySpotlight': { $exists: false },
            },
        },
        {
            $group: {
                _id: '$_id',
                stacks: { $first: '$$ROOT' },
            },
        },
        { $limit: limit },
        {
            $project: {
                stack: '$stacks',
            },
        },
    ];

    return creators().aggregate(stages).toArray();
};

export const updateManyStackSpotlight = async ({
    stacks,
}: UpdateManyStackSpotlight) => {
    stacks.forEach((stack) => {
        creators().updateOne(
            {
                [`search.${stack.type}`]: {
                    $elemMatch: { id: stack.id },
                },
            },
            {
                $set: {
                    [`search.${stack.type}.$.displaySpotlight`]: true,
                },
            }
        );
    });
};

export const updateManyStackSpotlightClear = async () => {
    await creators().updateMany(
        { 'search.slideshow': { $exists: true } },
        {
            $unset: {
                'search.slideshow.$[].displaySpotlight': '',
            },
        }
    );

    await creators().updateMany(
        { 'search.grid': { $exists: true } },
        {
            $unset: {
                'search.grid.$[].displaySpotlight': '',
            },
        }
    );

    await creators().updateMany(
        { 'search.video': { $exists: true } },
        {
            $unset: {
                'search.video.$[].displaySpotlight': '',
            },
        }
    );
};

export const findArtistsForSpotlight = async ({
    query,
    limit,
}: FindArtistsForSpotlightParams) =>
    creators()
        .aggregate([
            { $match: query },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    avatar: '$profile.avatar',
                },
            },
        ])
        .toArray();

export const markArtistWithFlag = async ({ ids }: MarkArtistWithFlagParams) =>
    creators().updateMany(
        { _id: { $in: ids } },
        { $set: { 'actions.displaySpotlight': true } }
    );

export const clearArtistMark = async () =>
    creators().updateMany(
        { 'actions.displaySpotlight': { $exists: true } },
        { $unset: { 'actions.displaySpotlight': '' } }
    );

export const filterArtistsWithConsign = async ({
    ids,
}: FilterArtistsWithConsignParams) =>
    creators()
        .aggregate([
            {
                $match: {
                    _id: { $in: ids },
                },
            },
            {
                $addFields: {
                    _idStr: { $toString: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'assets',
                    localField: '_idStr',
                    foreignField: 'framework.createdBy',
                    as: 'assets',
                },
            },
            {
                $match: {
                    // 'assets.contractExplorer': { $exists: true },
                    'assets.consignArtwork.status': 'active',
                },
            },
            {
                $project: {
                    _id: 1,
                    name: '$username',
                    'profile.avatar': 1,
                },
            },
        ])
        .toArray();

export const synapsSessionInit = async ({
    creatorId,
    sessionId,
}: SynapsSessionInitParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(creatorId) },
        {
            $set: {
                'synaps.sessionId': sessionId,
            },
        },
        { upsert: true }
    );
    return result;
};

export const changeStepsSynaps = async ({
    sessionId,
    status,
    steps,
}: ChangeStepsSynapsParams) => {
    const result = await creators().updateOne(
        { 'synaps.sessionId': sessionId },
        {
            $set: {
                'synaps.status': status,
                'synaps.steps': steps,
            },
        },
        { upsert: true }
    );

    return result;
};

export const findTruLevel = async ({ id }: FindTruLevelParams) => {
    const result = await creators().findOne(
        { _id: new ObjectId(id) },
        {
            projection: {
                truLevel: 1,
                vault: 1,
            },
        }
    );
    if (!result?.truLevel && result?.vault.vaultAddress) {
        await creators().updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    'framework.updatedAt': new Date(),
                },
            }
        );
    }
    return result;
};

export const changeTruLevel = async ({
    id,
    truLevel,
}: ChangeTruLevelParams) => {
    const result = await creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                truLevel,
            },
        }
    );

    return result;
};

export const checkHashAlreadyExists = async ({
    hash,
}: CheckHashAlreadyExistsParams) =>
    creators()
        .aggregate([
            {
                $match: { 'search.grid.hash': hash },
            },
        ])
        .toArray();

export const updateLicense = async ({
    id,
    license,
    value,
}: UpdateLicenseParams) =>
    creators().updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                [`licenses.${license}`]: value,
            },
        }
    );
export const countCreators = async ({ query }: CountCreatorsParams) =>
    creators().countDocuments(query);
