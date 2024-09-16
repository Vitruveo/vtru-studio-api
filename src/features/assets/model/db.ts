import { AssetsDocument, COLLECTION_ASSETS } from './schema';
import type {
    CreateAssetsParams,
    DeleteAssetsParams,
    FindOneAssetsParams,
    FindAssetsByIdParams,
    FindAssetsParams,
    UpdateAssetsParams,
    UpdateUploadedMediaKeysParams,
    RemoveUploadedMediaKeysParams,
    ReplaceUploadedMediaKeyParams,
    FindAssetsPaginatedParams,
    CountAssetsParams,
    FindAssetsTagsParams,
    FindAssetsCollectionsParams,
    FindAssetsSubjectsParams,
    FindAssetsByCreatorName,
    UpdateManyAssetsStatusParams,
    FindAssetsCarouselParams,
    CountAssetByCreatorIdWithConsignParams,
    UpdateManyAssetsNudityParams,
    FindAssetsGroupPaginatedParams,
    CountAssetsByCreatorIdParams,
    findAssetMintedByAddressParams,
    FindAssetsFromSlideshowParams,
    findAssetsByCreatorIdPaginatedParams,
} from './types';
import { FindOptions, getDb, ObjectId } from '../../../services/mongo';
import { buildFilterColorsQuery } from '../utils/color';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';

const assets = () => getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

// basic actions.
export const createAssets = async ({ asset }: CreateAssetsParams) => {
    const result = await assets().insertOne(asset);
    return result;
};

export const countAssetsGroup = async ({
    query,
}: CountAssetsByCreatorIdParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$framework.createdBy',
                    count: {
                        $sum: 1,
                    },
                },
            },
        ])
        .toArray();

export const findAssetGroupPaginated = ({
    query,
    skip,
    limit,
    sort,
}: FindAssetsGroupPaginatedParams) => {
    const aggregate = [
        { $match: query },
        {
            $group: {
                _id: '$framework.createdBy',
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'assets',
                let: { creatorId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$framework.createdBy', '$$creatorId'],
                            },
                            ...query,
                        },
                    },
                    {
                        $addFields: {
                            'licenses.nft.availableLicenses': {
                                $ifNull: ['$licenses.nft.availableLicenses', 1],
                            },
                        },
                    },
                    {
                        $project: {
                            paths: {
                                $cond: {
                                    if: {
                                        $isArray: '$formats.preview.path',
                                    },
                                    then: '$formats.preview.path',
                                    else: {
                                        $ifNull: [
                                            ['$formats.preview.path'],
                                            [],
                                        ],
                                    },
                                },
                            },
                            assetData: '$$ROOT',
                        },
                    },
                ],
                as: 'assetsWithPaths',
            },
        },
        {
            $addFields: {
                paths: {
                    $reduce: {
                        input: '$assetsWithPaths',
                        initialValue: [],
                        in: {
                            $concatArrays: ['$$value', '$$this.paths'],
                        },
                    },
                },
                asset: {
                    $let: {
                        vars: {
                            filteredAssets: {
                                $filter: {
                                    input: '$assetsWithPaths.assetData',
                                    as: 'asset',
                                    cond: {
                                        $not: [
                                            {
                                                $ifNull: [
                                                    '$$asset.mintExplorer',
                                                    false,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{ $size: '$$filteredAssets' }, 0],
                                },
                                then: { $last: '$$filteredAssets' },
                                else: {
                                    $first: '$assetsWithPaths.assetData',
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                creatorId: {
                    $toObjectId: '$asset.framework.createdBy',
                },
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creatorId',
                foreignField: '_id',
                as: 'creator',
            },
        },
        {
            $unwind: {
                path: '$creator',
            },
        },
        {
            $addFields: {
                username: '$creator.username',
            },
        },
        {
            $project: {
                assetsWithPaths: 0,
                creatorId: 0,
                creator: 0,
            },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
    ];

    return assets().aggregate(aggregate).toArray();
};

export const findAssetsPaginated = ({
    query,
    skip,
    limit,
    colors,
    precision,
    sort,
}: FindAssetsPaginatedParams) => {
    const aggregate = [
        { $match: query },
        {
            $addFields: {
                'licenses.nft.availableLicenses': {
                    $ifNull: ['$licenses.nft.availableLicenses', 1],
                },
                'assetMetadata.context.formData.colors': {
                    $ifNull: ['$assetMetadata.context.formData.colors', []],
                },
                insensitiveCreator: {
                    $cond: {
                        if: {
                            $isArray: '$assetMetadata.creators.formData.name',
                        },
                        then: {
                            $map: {
                                input: '$assetMetadata.creators.formData.name',
                                as: 'n',
                                in: { $toLower: '$$n' },
                            },
                        },
                        else: {
                            $toLower: '$assetMetadata.creators.formData.name',
                        },
                    },
                },
                exists: {
                    $cond: {
                        if: {
                            $gt: [colors?.length, 0],
                        },
                        then: {
                            $anyElementTrue: {
                                $map: {
                                    input: '$assetMetadata.context.formData.colors',
                                    as: 'colors',
                                    in: {
                                        $or: buildFilterColorsQuery(
                                            colors!,
                                            precision
                                        ),
                                    },
                                },
                            },
                        },
                        else: {
                            $literal: true,
                        },
                    },
                },
            },
        },
        {
            $match: {
                exists: true,
            },
        },
        {
            $addFields: {
                creatorId: {
                    $toObjectId: '$framework.createdBy',
                },
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creatorId',
                foreignField: '_id',
                as: 'creator',
            },
        },
        {
            $unwind: {
                path: '$creator',
            },
        },
        {
            $addFields: {
                username: '$creator.username',
            },
        },
        {
            $project: {
                creatorId: 0,
                creator: 0,
            },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
    ];

    return assets().aggregate(aggregate).toArray();
};

export const findAssetsByCreatorIdPaginated = ({
    query,
    skip,
    limit,
}: findAssetsByCreatorIdPaginatedParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $addFields: {
                    assetId: { $toString: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'requestConsigns',
                    localField: 'assetId',
                    foreignField: 'asset',
                    as: 'request',
                },
            },
            {
                $unwind: {
                    path: '$request',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    countComments: {
                        $cond: {
                            if: {
                                $gt: [{ $type: '$request' }, 'missing'],
                            },
                            then: {
                                $size: {
                                    $filter: {
                                        input: {
                                            $ifNull: ['$request.comments', []],
                                        },
                                        as: 'item',
                                        cond: {
                                            $eq: ['$$item.isPublic', true],
                                        },
                                    },
                                },
                            },
                            else: 0,
                        },
                    },
                },
            },
            {
                $project: {
                    request: 0,
                    assetId: 0,
                },
            },
            { $skip: skip },
            { $limit: limit },
        ])
        .toArray();

export const findMaxPrice = () =>
    assets()
        .aggregate([
            {
                $project: {
                    maxPrice: {
                        $max: [
                            {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$licenses.nft.editionOption',
                                            'elastic',
                                        ],
                                    },
                                    then: '$licenses.nft.elastic.editionPrice',
                                    else: 0,
                                },
                            },
                            {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$licenses.nft.editionOption',
                                            'single',
                                        ],
                                    },
                                    then: '$licenses.nft.single.editionPrice',
                                    else: 0,
                                },
                            },
                            {
                                $cond: {
                                    if: {
                                        $eq: [
                                            '$licenses.nft.editionOption',
                                            'unlimited',
                                        ],
                                    },
                                    then: '$licenses.nft.unlimited.editionPrice',
                                    else: 0,
                                },
                            },
                        ],
                    },
                },
            },
            { $sort: { maxPrice: -1 } },
            { $limit: 1 },
        ])
        .toArray()
        .then((result) => (result.length > 0 ? result[0].maxPrice : null));

export const countAssets = async ({
    query,
    colors,
    precision,
}: CountAssetsParams) => {
    const aggregate = [
        {
            $match: query,
        },
        {
            $addFields: {
                'licenses.nft.availableLicenses': {
                    $ifNull: ['$licenses.nft.availableLicenses', 1],
                },
                'assetMetadata.context.formData.colors': {
                    $ifNull: ['$assetMetadata.context.formData.colors', []],
                },
                exists: {
                    $cond: {
                        if: {
                            $gt: [colors?.length, 0],
                        },
                        then: {
                            $anyElementTrue: {
                                $map: {
                                    input: '$assetMetadata.context.formData.colors',
                                    as: 'colors',
                                    in: {
                                        $or: buildFilterColorsQuery(
                                            colors!,
                                            precision
                                        ),
                                    },
                                },
                            },
                        },
                        else: {
                            $literal: true,
                        },
                    },
                },
            },
        },
        {
            $match: {
                exists: true,
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
            },
        },
    ];
    return assets().aggregate(aggregate).toArray() as Promise<
        [{ count?: number }]
    >;
};

export const findAssetsCollections = ({
    name,
    showAdditionalAssets,
}: FindAssetsCollectionsParams) =>
    assets()
        .aggregate([
            {
                $unwind: '$assetMetadata.taxonomy.formData.collections',
            },
            {
                $match: {
                    'assetMetadata.taxonomy.formData.collections': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...(showAdditionalAssets === 'true'
                        ? {}
                        : { 'consignArtwork.status': 'active' }),
                },
            },
            {
                $group: {
                    _id: {
                        $toLower: {
                            $trim: {
                                input: '$assetMetadata.taxonomy.formData.collections',
                            },
                        },
                    },
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
            { $sort: { count: -1, collection: 1 } },
        ])
        .toArray();

export const findAssetsSubjects = ({
    name,
    showAdditionalAssets,
}: FindAssetsSubjectsParams) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.taxonomy.formData.subject' },
            {
                $match: {
                    'assetMetadata.taxonomy.formData.subject': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...(showAdditionalAssets === 'true'
                        ? {}
                        : { 'consignArtwork.status': 'active' }),
                },
            },
            {
                $group: {
                    _id: {
                        $toLower: {
                            $trim: {
                                input: '$assetMetadata.taxonomy.formData.subject',
                            },
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    subject: '$_id',
                    count: 1,
                },
            },
            { $sort: { count: -1, subject: 1 } },
        ])
        .toArray();

export const findAssetsTags = async ({ query }: FindAssetsTagsParams) =>
    assets()
        .aggregate([
            { $match: query },
            { $unwind: '$assetMetadata.taxonomy.formData.tags' },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$assetMetadata.taxonomy.formData.tags',
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    tag: '$_id',
                    count: 1,
                },
            },
        ])
        .toArray();

export const findAssetsByCreatorName = ({
    name,
    showAdditionalAssets,
}: FindAssetsByCreatorName) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.creators.formData' },
            {
                $match: {
                    'assetMetadata.creators.formData.name': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...(showAdditionalAssets === 'true'
                        ? {}
                        : { 'consignArtwork.status': 'active' }),
                },
            },
            {
                $addFields: {
                    insensitiveCreator: {
                        $cond: {
                            if: {
                                $isArray:
                                    '$assetMetadata.creators.formData.name',
                            },
                            then: {
                                $map: {
                                    input: '$assetMetadata.creators.formData.name',
                                    as: 'n',
                                    in: { $toLower: '$$n' },
                                },
                            },
                            else: {
                                $toLower:
                                    '$assetMetadata.creators.formData.name',
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$insensitiveCreator',
                        },
                    },
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
            { $sort: { count: -1, collection: 1 } },
        ])
        .toArray();

// return a stream of assets from database
export const findAssets = async ({
    query,
    sort,
    skip,
    limit,
}: FindAssetsParams) => {
    let result = assets().find(query, {}).sort(sort).skip(skip);

    if (limit) result = result.limit(limit);

    return result.stream();
};

export const findAssetsById = async ({ id }: FindAssetsByIdParams) => {
    const result = await assets().findOne({ _id: new ObjectId(id) });
    return result;
};

export const findAssetMintedByAddress = async ({
    address,
    sort,
}: findAssetMintedByAddressParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'mintExplorer.address': address,
                    'framework.createdBy': { $exists: true, $ne: '' },
                },
            },
            {
                $addFields: {
                    creatorId: {
                        $toObjectId: '$framework.createdBy',
                    },
                    insensitiveCreator: {
                        $cond: {
                            if: {
                                $isArray:
                                    '$assetMetadata.creators.formData.name',
                            },
                            then: {
                                $map: {
                                    input: '$assetMetadata.creators.formData.name',
                                    as: 'name',
                                    in: { $toLower: '$$name' },
                                },
                            },
                            else: {
                                $toLower:
                                    '$assetMetadata.creators.formData.name',
                            },
                        },
                    },
                    insensitiveTitle: {
                        $toLower: '$assetMetadata.context.formData.title',
                    },
                },
            },
            { $sort: sort },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'creatorId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    storeUrl: {
                        $concat: [
                            STORE_URL,
                            '/',
                            '$creator.username',
                            '/',
                            '$consignArtwork.assetKey',
                        ],
                    },
                    previewUrl: {
                        $concat: [
                            ASSET_STORAGE_URL,
                            '/',
                            '$formats.preview.path',
                        ],
                    },
                },
            },
        ])
        .toArray();

export const countAssetsByCreator = ({ query }: CountAssetsByCreatorIdParams) =>
    assets().countDocuments(query);

export const findAssetsByCreatorId = async ({ id }: FindAssetsByIdParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'framework.createdBy': id,
                },
            },
            {
                $addFields: {
                    assetId: { $toString: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'requestConsigns',
                    localField: 'assetId',
                    foreignField: 'asset',
                    as: 'request',
                },
            },
            {
                $unwind: {
                    path: '$request',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    countComments: {
                        $cond: {
                            if: {
                                $gt: [{ $type: '$request' }, 'missing'],
                            },
                            then: {
                                $size: {
                                    $filter: {
                                        input: {
                                            $ifNull: ['$request.comments', []],
                                        },
                                        as: 'item',
                                        cond: {
                                            $eq: ['$$item.isPublic', true],
                                        },
                                    },
                                },
                            },
                            else: 0,
                        },
                    },
                },
            },
            {
                $project: {
                    request: 0,
                    assetId: 0,
                },
            },
        ])
        .toArray();

export const findAssetCreatedBy = async ({ id }: FindAssetsByIdParams) => {
    const result = await assets().findOne({
        'framework.createdBy': id,
    });
    return result;
};

export const findOneAssets = async ({ query }: FindOneAssetsParams) => {
    const result = await assets().findOne<AssetsDocument>(query);
    return result;
};

export const updateAssets = async ({ id, asset }: UpdateAssetsParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $set: asset }
    );
    return result;
};

export const updateManyAssetsNudity = ({
    ids,
    nudity,
}: UpdateManyAssetsNudityParams) =>
    assets().updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        {
            $set: {
                'assetMetadata.taxonomy.formData.nudity': nudity ? 'yes' : 'no',
            },
        }
    );

export const updateManyAssetsStatus = async ({
    ids,
    status,
}: UpdateManyAssetsStatusParams) => {
    const result = await assets().updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        { $set: { 'consignArtwork.status': status } }
    );
    return result;
};

export const findAssetsByPath = ({
    path,
    query,
    options,
}: {
    path: string;
    query: Record<string, any>;
    options?: FindOptions;
}) =>
    assets()
        .find({ [path]: query }, options)
        .toArray();

export const findAssetsCodeZipByPath = async ({ path }: { path: string }) => {
    const result = await assets().findOne({
        'mediaAuxiliary.formats.codeZip.path': path,
    });

    return result;
};

export const deleteAssets = async ({ id }: DeleteAssetsParams) => {
    const result = await assets().deleteOne({ _id: new ObjectId(id) });
    return result;
};

export const updateUploadedMediaKeys = async ({
    id,
    mediaKey,
}: UpdateUploadedMediaKeysParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $push: { uploadedMediaKeys: mediaKey } }
    );
    return result;
};

export const replaceUploadedMediaKey = async ({
    id,
    oldMediaKey,
    newMediaKey,
}: ReplaceUploadedMediaKeyParams) => {
    await assets().updateOne(
        { _id: new ObjectId(id) },
        { $pull: { uploadedMediaKeys: oldMediaKey } }
    );

    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $push: { uploadedMediaKeys: newMediaKey } }
    );
    return result;
};

export const removeUploadedMediaKeys = async ({
    id,
    mediaKeys,
}: RemoveUploadedMediaKeysParams) => {
    const result = await assets().updateOne(
        { _id: new ObjectId(id) },
        { $pullAll: { uploadedMediaKeys: mediaKeys } }
    );
    return result;
};

export const findLastSoldAssets = () =>
    assets()
        .aggregate([
            {
                $match: {
                    mintExplorer: { $exists: true },
                    'assetMetadata.taxonomy.formData.nudity': 'no',
                    'consignArtwork.status': 'active',
                },
            },
            { $sort: { 'mintExplorer.createdAt': -1 } },
            { $limit: 50 },
            {
                $addFields: {
                    creatorId: {
                        $toObjectId: '$framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'creatorId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    _id: '$_id',
                    assetMetadata: '$assetMetadata',
                    formats: '$formats.preview',
                    licenses: '$licenses.nft',
                    username: '$creator.username',
                },
            },
        ])
        .toArray();

export const findAssetsCarousel = ({
    layout,
    nudity,
}: FindAssetsCarouselParams) =>
    assets()
        .aggregate([
            {
                $addFields: {
                    randomField: { $rand: {} },
                    createdBy: {
                        $toObjectId: '$framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creatorInformation',
                },
            },
            {
                $unwind: '$creatorInformation',
            },
            {
                $match: {
                    'consignArtwork.status': 'active',
                    'contractExplorer.explorer': {
                        $exists: true,
                    },
                    'licenses.nft.added': true,
                    'formats.display.path': {
                        $exists: true,
                        $ne: null,
                    },
                    creatorInformation: {
                        $exists: true,
                    },
                    'assetMetadata.context.formData.orientation':
                        layout ?? 'horizontal',
                    'assetMetadata.taxonomy.formData.nudity': nudity ?? 'no',
                },
            },
            {
                $sort: {
                    randomField: 1,
                },
            },
            {
                $project: {
                    asset: {
                        image: '$formats.display.path',
                        title: '$assetMetadata.context.formData.title',
                        description:
                            '$assetMetadata.context.formData.description',
                    },
                    creator: {
                        avatar: '$creatorInformation.profile.avatar',
                        username: '$creatorInformation.username',
                    },
                },
            },
        ])
        .toArray();

export const countAssetConsignedByCreator = ({
    creatorId,
}: CountAssetByCreatorIdWithConsignParams) =>
    assets().countDocuments({
        contractExplorer: { $exists: true },
        'consignArtwork.status': 'active',
        'framework.createdBy': creatorId,
    });

export const findAssetsFromSlideshow = ({
    query,
}: FindAssetsFromSlideshowParams) =>
    assets()
        .aggregate([
            { $match: query },
            {
                $addFields: {
                    createdBy: {
                        $toObjectId: '$framework.createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $project: {
                    title: '$assetMetadata.context.formData.title',
                    image: '$formats.exhibition.path',
                    orientation: '$assetMetadata.context.formData.orientation',
                    username: '$creator.username',
                    avatar: '$creator.profile.avatar',
                },
            },
        ])
        .toArray();
