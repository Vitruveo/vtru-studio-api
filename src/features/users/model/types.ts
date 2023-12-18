import type { ObjectId } from '../../../services/mongo';
import { User } from './schema';

export interface LoginHistory {
    ip: string;
    createdAt: Date;
}
export interface Login {
    email: string;
    codeHash: string;
    loginHistory: LoginHistory[];
}
export interface CreateUserParams {
    user: Omit<Partial<User>, 'login'> & {
        login: Omit<Login, 'loginHistory'>;
    };
}

export interface FindUsersParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindUserByIdParams {
    id: string | ObjectId;
}

export interface FindOneUserParams {
    query: any;
}

export interface UpdateUserParams {
    id: string | ObjectId;
    user: Omit<Partial<User>, 'login'> & {
        login: Partial<Login>;
    };
}

export interface PushLoginHistoryParams {
    id: string | ObjectId;
    data: LoginHistory;
}

export interface DeleteUserParams {
    id: string | ObjectId;
}
