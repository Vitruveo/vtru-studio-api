import { Document, Sort } from 'mongodb';
import { Assets, AssetsDocument } from './schema';
import { ObjectId } from '../../../services';

export interface CreateAssetsParams {
    asset: AssetsDocument;
}

export interface FindAssetsGroupPaginatedParams {
    query: {
        [key: string]: unknown;
        _id?: { $in: string[] | ObjectId[] };
    };
    skip: number;
    limit: number;
    sort: Sort;
    grouped: string;
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
    licenseArtCards: number;
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

export interface CountAssetsWithLicenseArtCardsByCreatorParams {
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
    extends Pick<FindAssetsPaginatedParams, 'query'> {
    grouped?: string;
}
export interface CountAssetsParams
    extends Pick<FindAssetsPaginatedParams, 'colors' | 'precision' | 'query'> { }

export interface FindAssetsByIdParams {
    id: string | ObjectId;
}

export interface FindLastConsignsParams {
    id: string | ObjectId;
    creatorId: string;
}

export interface CountAssetsWithLicenseArtCardsParams {
    status: string;
}

export interface FindAssetsWithArtCardsPaginatedParams {
    query: any;
    sort: any;
    skip: number;
    limit: number;
}

export interface UpdateAssetArtCardsStatusParams {
    id: string;
    status: string;
}

export interface FindMyAssetsParams {
    query: { [key: string]: unknown };
}

export interface FindOneAssetsParams {
    query: any;
}

export interface UpdateAssetsParams {
    id: string | ObjectId;
    asset: Assets | { [key: string]: unknown };
}

export interface UpdateManyAssetSpotlightParams {
    ids: string[];
}

export interface UpdateManyAssetsStatusParams {
    ids: string[] | ObjectId[];
    status: string;
}

export interface UpdateManyAssetsAutoStakeParams {
    creatorId: string | ObjectId;
    autoStake: boolean;
}

export interface UpdateManyAssetsNudityParams {
    ids: string[] | ObjectId[];
    nudity: boolean;
}

export interface CountAllAssetsParams {
    query?: any;
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

export interface FindAssetsForSpotlightParams {
    query: any;
    limit: number;
}

export interface CountArtsByCreatorParams {
    query: any;
}

export interface UpateAssetsUsernameParams {
    data: AssetsDocument[];
    username: string;
}

export interface FindAssetsParams {
    query: Record<string, unknown>;
}

export interface FindLastSoldAssets {
    query: Record<string, unknown>;
}
