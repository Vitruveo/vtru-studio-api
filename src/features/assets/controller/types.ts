import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>;
    page: number;
    limit: number;
    sort: any;
    minPrice: number;
    maxPrice: number;
    name?: string;
}

export interface QueryCollectionParams {
    name: string;
}

interface Tags {
    tag: string;
    count: number;
}

export interface ResponseAssetsPaginated {
    data: model.AssetsDocument[];
    tags: Tags[];
    page: number;
    totalPage: number;
    total: number;
    limit: number;
}

export interface DataIPFS {
    [key: string]: string;
}

export interface ResponseCreateContract {
    explorer: string;
    tx: string;
    assetId: number;
}
