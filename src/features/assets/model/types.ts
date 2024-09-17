import { Document, Sort } from 'mongodb';
import { Assets, AssetsDocument } from './schema';
import { ObjectId } from '../../../services';

export interface CreateAssetsParams {
    asset: AssetsDocument;
}

export interface FindAssetsParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindAssetsGroupPaginatedParams {
    query: {
        [key: string]: unknown;
        _id?: { $in: string[] | ObjectId[] };
    };
    skip: number;
    limit: number;
    sort: Sort;
}

export interface FindAssetsPaginatedParams {
    query: {
        [key: string]: unknown;
        _id?: { $in: string[] | ObjectId[] };
    };
    sort: Sort;
    skip: number;
    limit: number;
    colors?: number[][];
    precision: number;
}

export interface findAssetsByCreatorIdPaginatedParams {
    query: any;
    skip: number;
    limit: number;
    sort: Sort;
}

export interface AssetsPaginatedResponse {
    data: Assets[];
    page: number;
    totalPage: number;
    total: number;
    limit: number;
    collection: string;
    collections: Document[];
}

export interface FindAssetsTagsParams {
    query: Record<string, unknown>;
}
export interface FindAssetsByCreatorName {
    name: string;
    showAdditionalAssets: string;
}

export interface FindCollectionsByCreatorParams {
    creatorId: string;
}

export interface FindAssetsCollectionsParams {
    name: string;
    showAdditionalAssets: string;
}

export interface FindAssetsSubjectsParams {
    name: string;
    showAdditionalAssets: string;
}

export interface CountAssetsByCreatorIdParams
    extends Pick<FindAssetsPaginatedParams, 'query'> {}
export interface CountAssetsParams
    extends Pick<FindAssetsPaginatedParams, 'colors' | 'precision' | 'query'> {}

export interface FindAssetsByIdParams {
    id: string | ObjectId;
}

export interface FindOneAssetsParams {
    query: any;
}

export interface UpdateAssetsParams {
    id: string | ObjectId;
    asset: Assets | { [key: string]: unknown };
}

export interface UpdateManyAssetsStatusParams {
    ids: string[] | ObjectId[];
    status: string;
}

export interface UpdateManyAssetsNudityParams {
    ids: string[] | ObjectId[];
    nudity: boolean;
}

export interface DeleteAssetsParams {
    id: string | ObjectId;
}

export interface UpdateUploadedMediaKeysParams {
    id: string | ObjectId;
    mediaKey: string;
}

export interface ReplaceUploadedMediaKeyParams {
    id: string | ObjectId;
    oldMediaKey: string;
    newMediaKey: string;
}

export interface RemoveUploadedMediaKeysParams {
    id: string | ObjectId;
    mediaKeys: string[];
}

export interface FindAssetsCarouselParams {
    layout?: 'vertical' | 'horizontal';
    nudity?: 'yes' | 'no';
}

export interface CountAssetByCreatorIdWithConsignParams {
    creatorId: string;
}

export interface findAssetMintedByAddressParams {
    address: string;
    sort: Sort;
}

export interface FindAssetsFromSlideshowParams {
    query: any;
}
