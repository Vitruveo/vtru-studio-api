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
} from './types';
import { FindOptions, getDb, ObjectId } from '../../../services/mongo';

const assets = () => getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

// basic actions.
export const createAssets = async ({ asset }: CreateAssetsParams) => {
    const result = await assets().insertOne(asset);
    return result;
};

// recebendo _ids para filtrar os assets por _id e retornar os assets paginados
export const findAssetsPaginated = async ({
    query,
    sort,
    skip,
    limit,
}: FindAssetsPaginatedParams) => {
    const parsedQuery = { ...query };

    if (parsedQuery._id && parsedQuery._id?.$in) {
        parsedQuery._id.$in = parsedQuery._id.$in.map((id) => new ObjectId(id));
    }

    return assets()
        .find(parsedQuery, {})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
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
        .then((result) => result.length > 0 ? result[0].maxPrice : null)

export const countAssets = async ({ query }: CountAssetsParams) =>
    assets().countDocuments(query);

export const findAssetsCollections = async ({
    name,
}: FindAssetsCollectionsParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'assetMetadata.taxonomy.formData.collections': {
                        $regex: new RegExp(name, 'i'),
                    },
                },
            },
            {
                $unwind: '$assetMetadata.taxonomy.formData.collections',
            },
            {
                $group: {
                    _id: '$assetMetadata.taxonomy.formData.collections',
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
        ])
        .toArray();

export const findAssetsSubjects = async ({ name }: FindAssetsSubjectsParams) =>
    assets()
        .aggregate([
            {
                $match: {
                    'assetMetadata.taxonomy.formData.subject': {
                        $regex: new RegExp(name, 'i'),
                    },
                },
            },
            {
                $unwind: '$assetMetadata.taxonomy.formData.subject',
            },
            {
                $group: {
                    _id: '$assetMetadata.taxonomy.formData.subject',
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
        ])
        .toArray();

export const findAssetsTags = async ({ query }: FindAssetsTagsParams) =>
    assets()
        .aggregate([
            { $match: query },
            { $unwind: '$assetMetadata.taxonomy.formData.tags' },
            {
                $group: {
                    _id: '$assetMetadata.taxonomy.formData.tags',
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
