import { Sort } from 'mongodb';
import { Stores } from './schema';

export interface FindStoresByCreatorParams {
    query: any;
    skip: number;
    limit: number;
    sort: Sort;
}
export interface UpdateStoresParams {
    id: string;
    data: Partial<Stores>;
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