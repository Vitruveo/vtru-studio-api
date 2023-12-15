import { Creator } from './schema';
import { ObjectId } from '../../../services';

export interface LoginHistory {
    ip: string;
    createdAt: Date;
}
export interface Login {
    codeHash: string;
    loginHistory: LoginHistory[];
}
export interface CreateCreatorParams {
    creator: Partial<Creator>;
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
    creator: Omit<Partial<Creator>, 'login'> & {
        login: Partial<Login>;
    };
}

export interface UpdateCodeHashEmailCreatorParams {
    id: string | ObjectId;
    email: string;
    codeHash: string | null;
    checkedAt: Date | null;
}

export interface AddEmailCreatorParams {
    id: string | ObjectId;
    email: string;
}

export interface PushLoginHistoryParams {
    id: string | ObjectId;
    data: LoginHistory;
}

export interface DeleteCreatorParams {
    id: string | ObjectId;
}

export interface CheckUsernameExistParams {
    username: string;
}

export interface AddEmailParams {
    email: string;
}
