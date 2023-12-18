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

export interface FindAssetsByIdParams {
    id: string | ObjectId;
}

export interface FindOneAssetsParams {
    query: any;
}

export interface UpdateAssetsParams {
    id: string | ObjectId;
    asset: Assets;
}

export interface DeleteAssetsParams {
    id: string | ObjectId;
}
