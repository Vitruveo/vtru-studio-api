import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>;
    page: string;
    limit: string;
    sort: {
        order: string;
        isIncludeSold: string;
    };
    minPrice: string;
    maxPrice: string;
    name?: string;
    showOnlyAvailableArts?: boolean;
    precision?: string;
    showAdditionalAssets: string;
    hasBts: string;
    hasNftAutoStake: boolean;
    storesId?: string;
}

export interface QueryCollectionParams {
    name: string;
    showAdditionalAssets: string;
}

export interface QueryTagsParams {
    name: string;
    showAdditionalAssets: boolean;
}

export interface QueryParams {
    query: Record<string, unknown>;
    sort?: {
        field: string;
        order: number;
    };
}

interface Tags {
    tag: string;
    count: number;
    showAdditionalAssets: string;
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

export interface QueryScopeNftParams {
    sort: string;
}

export interface ResponsePaginatedAdmin {
    data: model.AssetsDocument[];
    page: number;
    totalPage: number;
    total: number;
    limit: number;
}

export interface Spotlight {
    _id: string;
    title: string;
    licenses: string;
    preview: string;
    author: string;
    nudity: string;
    vault: {
        transactionhash: string | null;
        vaultAddress: string | null;
    };
}

export interface ArtistSpotlight {
    _id: string;
    avatar: string;
    username: string;
}

export interface GroupedParams {
    query: Record<string, unknown>;
    page: string;
    limit: string;
    name: string;
    sort: QueryPaginatedParams['sort'];
}

export type StoresVisibilityStatus =
    | 'visibleInAllStores'
    | 'visibleInSelectedStores'
    | 'hiddenInSelectedStores'
    | 'hiddenInAllStores';

export interface StoresVisibilityBody {
    visibility: StoresVisibilityStatus;
    list: string[];
}

export interface StorePackItem {
    id: string;
    path: string;
    title: string;
    username: string;
    avatar: string;
    qrCode: string;
    logo: string;
}
