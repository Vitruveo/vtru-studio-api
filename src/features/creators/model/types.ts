import { Sort } from 'mongodb';
import { Creator, CreatorDocument } from './schema';
import { ObjectId } from '../../../services';
import { Framework } from '../../common/record';

export interface LoginHistory {
    ip: string;
    createdAt: Date;
}
export interface Login {
    codeHash: string;
    loginHistory: LoginHistory[];
}
export interface CreateCreatorParams {
    creator: CreatorDocument;
}

export interface FindCreatorsParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindCreatorByIdParams {
    id: string | ObjectId;
}

export interface FindCreatorAssetsByGridId {
    id: string;
}

export interface FindCreatorAssetsByVideoId {
    id: string;
}
export interface FindCreatorAssetsBySlideshowId {
    id: string;
}

export interface FindOneCreatorParams {
    query: any;
}

export interface UpdateCreatorParams {
    id: string | ObjectId;
    creator: Partial<Creator>;
}

export interface UpdateCodeHashEmailCreatorParams {
    id: string | ObjectId;
    email: string;
    codeHash: string | null;
    checkedAt: Date | null;
    framework: Framework;
}

export interface AddEmailCreatorParams {
    id: string | ObjectId;
    email: string;
    framework: Framework;
}

export interface PushLoginHistoryParams {
    id: string | ObjectId;
    data: LoginHistory;
}

export interface DeleteCreatorParams {
    id: string | ObjectId;
}

export interface DeleteCreatorEmailParams {
    email: string;
}

export interface CheckUsernameExistParams {
    username: string;
}

export interface AddEmailParams {
    email: string;
}

export interface UpdateAvatarParams {
    id: string | ObjectId;
    fileId: string;
}

export interface CheckWalletExistsParams {
    address: string;
    id: string;
}

export interface updateCreatorSearchVideoParams {
    id: string | ObjectId;
    video: {
        id: string;
        url: string;
        thumbnail: string | null;
        title: string;
        sound: string;
        fees: number;
        assets: string[];
        description: string;
    };
}

export interface UpdateCreatorSocialById {
    id: string;
    key: 'x' | 'facebook' | 'google';
    value: {
        name: string;
        avatar: string;
    };
}

export interface RemoveCreatorSocialById {
    id: string;
    key: 'x' | 'facebook' | 'google';
}

export interface FindCreatorsByName {
    name: string;
}

export interface UpdateCreatorSearchGridParams {
    id: string;
    grid: {
        id: string;
        path: string;
        fees: number;
        assets: string[];
        title: string;
        description: string;
    };
    hash: string;
}

export interface UpdateCreatorSearchSlideshowParams {
    id: string;
    slideshow: {
        id: string;
        assets: string[];
        fees: number;
        title: string;
        interval: number;
        display: string;
        description: string;
    };
}

export interface FindCreatorsStacksParams {
    query: any;
    sort: Sort;
    skip: number;
    limit: number;
}

export interface FindCreatorByUsernameParams {
    username: string;
}
export interface CountAllStacksParams {
    type: 'grid' | 'slideshow' | 'video';
}
export interface UpdateManyStackSpotlight {
    stacks: {
        id: string;
        type: string;
    }[];
}

export interface FindArtistsForSpotlightParams {
    query?: any;
    limit: number;
}

export interface MarkArtistWithFlagParams {
    ids: ObjectId[];
}

export interface FilterArtistsWithConsignParams {
    ids: ObjectId[];
}

export interface ChangeStepsSynapsParams {
    sessionId: string;
    stepId: string;
    stepName: string;
    status:
        | 'SUBMISSION_REQUIRED'
        | 'PENDING_VERIFICATION'
        | 'APPROVED'
        | 'REJECTED';
}

export interface ChangeTruLevelParams {
    id: string | ObjectId;
    truLevel: Creator['truLevel'];
}

export interface SynapsSessionInitParams {
    sessionId: string;
    creatorId: string;
}
export interface CheckHashAlreadyExistsParams {
    hash: string;
}

export interface UpdateLicenseParams {
    id: string | ObjectId;
    license: string;
    value: number;
}
