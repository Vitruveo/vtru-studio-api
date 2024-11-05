import { Stores } from './schema';

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
