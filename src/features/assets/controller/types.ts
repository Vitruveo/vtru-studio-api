import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>[];
    page: number;
    limit: number;
    sort: any;
}

export interface ResponseAssetsPaginated {
    data: model.AssetsDocument[];
    page: number;
    totalPage: number;
    total: number;
    limit: number;
}
