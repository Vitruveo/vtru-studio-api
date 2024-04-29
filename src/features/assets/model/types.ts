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

export interface FindAssetsPaginatedParams {
    query: Record<string, unknown>;
    sort: any;
    skip: number;
    limit: number;
}

export interface FindAssetsTagsParams {
    query: Record<string, unknown>;
}

export interface FindAssetsCollectionsParams {
    name: string;
}

export interface FindAssetsSubjectsParams {
    name: string;
}
export interface CountAssetsParams {
    query: Record<string, unknown>;
}

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
