import { User } from './schema';

export interface CreateUserParams {
    user: User;
}

export interface FindUsersParams {
    query: any;
    sort: any;
    skip: number;
    limit: number;
}

export interface FindOneUserParams {
    id: string;
}

export interface UpdateUserParams {
    id: string;
    user: User;
}

export interface DeleteUserParams {
    id: string;
}

export interface StartPasswordRecoveryParams {
    email: string;
}

export interface FinishPasswordRecoveryParams {
    token: string;
    newPassword: string;
}
