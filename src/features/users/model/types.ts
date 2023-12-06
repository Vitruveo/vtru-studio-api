import { User } from './schema';

export interface LoginHistory {
    id: string;
    createdAt: Date;
}
export interface Login {
    email: string;
    codeHash: string;
    loginHistory: LoginHistory[];
}
export interface CreateUserParams {
    user: Omit<Partial<User>, 'login'> & {
        login?: Omit<Partial<Login>, 'loginHistory'>;
    };
}

export interface FindUsersParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindUserByIdParams {
    id: string;
}

export interface FindOneUserParams {
    query: any;
}

export interface UpdateUserParams {
    id: string;
    user: Omit<Partial<User>, 'login'> & {
        login?: Omit<Partial<Login>, 'loginHistory'>;
    };
}

export interface DeleteUserParams {
    id: string;
}
