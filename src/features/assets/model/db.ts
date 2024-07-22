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
} from './types';
import { FindOptions, getDb, ObjectId } from '../../../services/mongo';
import { conditionsToShowAssets } from '../controller/public';
import { buildFilterColorsQuery } from '../utils/color';

const assets = () => getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

// basic actions.
export const createAssets = async ({ asset }: CreateAssetsParams) => {
    const result = await assets().insertOne(asset);
    return result;
};

export const findAssetsPaginated = ({
    query,
    skip,
    limit,
    colors,
    precision,
}: FindAssetsPaginatedParams) => {
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
            $sort: {
                'consignArtwork.status': 1,
                'licenses.nft.availableLicenses': -1,
                'consignArtwork.listing': -1,
            },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
    ];

    return assets().aggregate(aggregate).toArray();
};

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

export const findAssetsCollections = ({ name }: FindAssetsCollectionsParams) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.taxonomy.formData.collections' },
            {
                $match: {
                    'assetMetadata.taxonomy.formData.collections': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$assetMetadata.taxonomy.formData.collections',
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

export const findAssetsSubjects = ({ name }: FindAssetsSubjectsParams) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.taxonomy.formData.subject' },
            {
                $match: {
                    'assetMetadata.taxonomy.formData.subject': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$assetMetadata.taxonomy.formData.subject',
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

export const findAssetsByCreatorName = ({ name }: FindAssetsByCreatorName) =>
    assets()
        .aggregate([
            { $unwind: '$assetMetadata.creators.formData' },
            {
                $match: {
                    'assetMetadata.creators.formData.name': {
                        $regex: new RegExp(`(^| )${name}`, 'i'),
                    },
                    ...conditionsToShowAssets,
                },
            },
            {
                $group: {
                    _id: {
                        $trim: {
                            input: '$assetMetadata.creators.formData.name',
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

export const findAssetsByCreatorId = async ({ id }: FindAssetsByIdParams) =>
    assets().find({ 'framework.createdBy': id }).toArray();

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
                },
            },
            {
                $sort: { 'consignArtwork.listing': -1 },
            },
            {
                $limit: 50,
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
                    'consignArtwork.listing': 1,
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
