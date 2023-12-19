import { Permission } from './schema';

export interface CreatePermissionParams {
    permission: Permission;
}

export interface FindPermissionsParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}

export interface FindPermissionByIdParams {
    id: string;
}

export interface FindPermissionsByIdsParams {
    ids: string[];
}

export interface FindOnePermissionParams {
    query: any;
}

export interface UpdatePermissionParams {
    id: string;
    permission: Permission;
}

export interface DeletePermissionParams {
    id: string;
}
