export interface StackeImage {
    artworkUrl: string;
    artistUrl: string;
    artistName: string;
    title: string;
}

export interface GenerateVideosParams {
    stackImages: StackeImage[];
    sound: string;
}

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

export interface Response {
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

export interface IsVideoParams {
    path: string;
}
