import { Sort } from 'mongodb';
import { Stores, StoreStatus } from './schema';

export interface FindStoresByCreatorParams {
    query: any;
    skip: number;
    limit: number;
    sort: Sort;
}

export interface FindStoresPaginatedParams {
    query: any;
    skip: number;
    limit: number;
    sort?: Sort;
}

export interface UpdateStoresParams {
    id: string;
    data: Partial<Stores>;
}

export interface UpdateStatusStoresFromCreatorParams {
    id: string;
    status: 'draft' | 'pending' | 'active' | 'inactive' | 'hidden' | undefined;
}
export interface UpdateStatusStoreParams {
    id: string;
    status: StoreStatus;
    moderatorId: string;
}

export interface UpdateStepStoresParams {
    id: string;
    stepName: string;
    data: Partial<Stores>;
}

export interface UpdateFormatOrganizationsParams {
    id: string;
    format: string;
    data: {
        name: string;
        path: string;
    };
}

export interface CheckUrlIsUniqueParams {
    id: string;
    url: string;
}

export interface FindStoresMissingSpotlightParams {
    ids: string[];
    limit: number;
}
