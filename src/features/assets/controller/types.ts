import { Sort } from 'mongodb';
import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>;
    page: number;
    limit: number;
    sort: Sort;
    minPrice: number;
    maxPrice: number;
    name?: string;
    showOnlyAvailableArts?: boolean;
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
    maxPrice: number;
}

export interface DataIPFS {
    [key: string]: string;
}

export interface ResponseCreateContract {
    explorer: string;
    tx: string;
    assetId: number;
}
