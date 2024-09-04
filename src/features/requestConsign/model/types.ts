import { RequestConsign } from './schema';

export interface CreateRequestConsignParams {
    requestConsign: RequestConsign;
}

export interface FindRequestConsignsPaginatedParams {
    query: any;
    sort: any;
    skip: number;
    limit: number;
}

export interface FindRequestConsignsParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface RequestConsignsPaginatedResponse {
    data: RequestConsign[];
    page: number;
    totalPage: number;
    total: number;
    limit: number;
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

export interface FindCommentsByAssetParams {
    assetId: string;
}

export interface UpdateRequestConsignParams {
    id: string;
    requestConsign: Record<string, any>;
}

export interface updateCommentVisibilityParams {
    id: string;
    commentId: string;
    isPublic: boolean;
}
export interface DeleteRequestConsignByIdParams {
    id: string;
}

export interface DeleteRequestConsignByAssetParams {
    id: string;
}
