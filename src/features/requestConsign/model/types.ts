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

export interface FindOneRequestConsignByCreatorParams {
    creator: string;
    assetId: string;
}

export interface UpdateRequestConsignParams {
    id: string;
    requestConsign: Record<string, any>;
}

export interface DeleteRequestConsignByIdParams {
    id: string;
}

export interface DeleteRequestConsignByAssetParams {
    id: string;
}
