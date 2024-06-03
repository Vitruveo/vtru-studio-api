import { RequestConsign } from './schema';

export interface CreateRequestConsignParams {
    requestConsign: RequestConsign;
}

export interface FindRequestConsignsParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindRequestConsignByIdParams {
    id: string;
}

export interface FindRequestConsignsByIdsParams {
    ids: string[];
}

export interface FindOneRequestConsignParams {
    query: any;
}

export interface UpdateRequestConsignParams {
    id: string;
    requestConsign: RequestConsign;
}
