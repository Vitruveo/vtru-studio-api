import { RequestConsign, Status } from './schema';

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

export interface FindOneRequestConsignByCreatorParams {
    creator: string;
}

export interface UpdateRequestConsignStatusParams {
    id: string;
    requestConsignStatus: Status;
}
