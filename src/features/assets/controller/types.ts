import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>;
    page: number;
    limit: number;
    sort: any;
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
