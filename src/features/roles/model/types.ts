import { Role } from './schema';

export interface CreateRoleParams {
    role: Role;
}

export interface FindRolesParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindRoleByIdParams {
    id: string;
}

export interface FindOneRoleParams {
    query: any;
}

export interface UpdateRoleParams {
    id: string;
    role: Role;
}

export interface DeleteRoleParams {
    id: string;
}
