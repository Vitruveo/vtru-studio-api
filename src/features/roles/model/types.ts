import { Role } from './schema';
import { ObjectId } from '../../../services';

export interface CreateRoleParams {
    role: Role;
    createdBy: string;
}

export interface FindRolesParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
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
    updatedBy: string;
}

export interface DeleteRoleParams {
    id: string | ObjectId;
}
