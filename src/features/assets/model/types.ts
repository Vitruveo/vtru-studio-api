import { Assets } from './schema';
import { ObjectId } from '../../../services';

export interface CreateAssetsParams {
    asset: Assets;
    createdBy: string;
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
    updatedBy: string;
}

export interface DeleteAssetsParams {
    id: string | ObjectId;
}
