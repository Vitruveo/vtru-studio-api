import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>;
    page: string;
    limit: string;
    sort: string;
    minPrice: string;
    maxPrice: string;
    name?: string;
    showOnlyAvailableArts?: boolean;
    precision?: string;
    showAdditionalAssets: string;
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

export interface CarouselResponse {
    _id: string;
    asset: {
        image?: string;
        title: string;
        description: string;
    };
    creator: {
        avatar?: string;
        username: string;
    };
}
