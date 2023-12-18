import { Permission } from './schema';

export interface CreatePermissionParams {
    permission: Permission;
    createdBy: string;
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

export interface FindOnePermissionParams {
    query: any;
}

export interface UpdatePermissionParams {
    id: string;
    permission: Permission;
    updatedBy: string;
}

export interface DeletePermissionParams {
    id: string;
}
