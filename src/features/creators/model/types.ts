import { Creator } from './schema';

export interface LoginHistory {
    ip: string;
    createdAt: Date;
}
export interface Login {
    email: string;
    codeHash: string;
    loginHistory: LoginHistory[];
}
export interface CreateCreatorParams {
    creator: Omit<Partial<Creator>, 'login'> & {
        login: Omit<Login, 'loginHistory'>;
    };
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

export interface PushLoginHistoryParams {
    id: string;
    data: LoginHistory;
}

export interface DeleteCreatorParams {
    id: string;
}
