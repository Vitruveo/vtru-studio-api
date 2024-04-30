import { model } from '..';

export interface QueryPaginatedParams {
    query: Record<string, unknown>;
    page: number;
    limit: number;
    sort: any;
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
}

export interface DataIPFS {
    [key: string]: string;
}

export interface ResponseCreateContract {
    explorer: string;
    tx: string;
    assetId: number;
}

// Tipos relacionados à criação de um vídeo
export interface Clip {
    asset: {
        type: string;
        src: string;
    };
    start: number;
    length: number;
    effect: string;
}

export interface Track {
    clips: Clip[];
}

export interface Soundtrack {
    src: string;
    effect: string;
}

export interface Timeline {
    tracks: Track[];
    soundtrack: Soundtrack;
    background: string;
}

export interface Output {
    format: string;
    resolution: string;
    aspectRatio: string;
    fps: number;
}

export interface MakeVideoResponse {
    id: string;
    owner: string;
    status: string;
    plan: string;
    error: string;
    duration: number;
    renderTime: number;
    url: string;
    poster: any;
    thumbnail: any;
    data: {
        timeline: Timeline;
        output: Output;
    };
    created: string;
    updated: string;
    createdBy: string;
}
