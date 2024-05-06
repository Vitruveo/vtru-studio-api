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
}

export interface AddVideoToGalleryParams {
    id: string | ObjectId;
    url: string;
    thumbnail: string | null;
    title: string;
}

export interface FindCreatorsByName {
    name: string;
}