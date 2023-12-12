import { Creator } from './schema';

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
    id: string;
}

export interface FindOneCreatorParams {
    query: any;
}

export interface UpdateCreatorParams {
    id: string;
    creator: Omit<Partial<Creator>, 'login'> & {
        login: Partial<Login>;
    };
}

export interface UpdateCodeHashEmailCreatorParams {
    id: string;
    email: string;
    codeHash: string | null;
    checkedAt: Date | null;
}

export interface AddEmailCreatorParams {
    id: string;
    email: string;
}

export interface PushLoginHistoryParams {
    id: string;
    data: LoginHistory;
}

export interface DeleteCreatorParams {
    id: string;
}

export interface CheckUsernameExistParams {
    username: string;
}

export interface AddEmailParams {
    email: string;
}
