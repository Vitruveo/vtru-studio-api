import { Role } from './schema';
import { ObjectId } from '../../../services';

export interface CreateRoleParams {
    role: Role;
}

export interface FindRolesParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindRolesPaginatedParams {
    query: any;
    skip: number;
    limit: number;
}

export interface FindRolesReturnPermissionsParams {
    ids: string[];
}

export interface FindRoleByIdParams {
    id: string | ObjectId;
}

export interface FindOneRoleParams {
    query: any;
}

export interface UpdateRoleParams {
    id: string | ObjectId;
    role: Role;
}

export interface DeleteRoleParams {
    id: string | ObjectId;
}

export interface CountRolesParams {
    query: any;
}
