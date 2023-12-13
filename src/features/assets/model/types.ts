import { Assets } from './schema';

export interface CreateAssetsParams {
    asset: Assets;
}

export interface FindAssetsParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindAssetsByIdParams {
    id: string;
}

export interface FindOneAssetsParams {
    query: any;
}

export interface UpdateAssetsParams {
    id: string;
    asset: Assets;
}

export interface DeleteAssetsParams {
    id: string;
}
