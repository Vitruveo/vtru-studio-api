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
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const assets = () => getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

// basic actions
export const createAssets = async ({ asset }: CreateAssetsParams) => {
    const result = await assets().insertOne(asset);
    return result;
};

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
