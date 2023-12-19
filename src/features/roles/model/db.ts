import { RoleDocument, COLLECTION_ROLES } from './schema';
import type {
    CreateRoleParams,
    DeleteRoleParams,
    FindOneRoleParams,
    FindRoleByIdParams,
    FindRolesParams,
    FindRolesReturnPermissionsParams,
    UpdateRoleParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const roles = () => getDb().collection(COLLECTION_ROLES);

// basic actions
export const createRole = async ({ role }: CreateRoleParams) => {
    const result = await roles().insertOne(role);
    return result;
};

// return a stream of roles from database
export const findRoles = async ({
    query,
    sort,
    skip,
    limit,
}: FindRolesParams) => {
    let result = roles().find(query, {}).sort(sort).skip(skip);

    if (limit) result = result.limit(limit);

    return result.stream();
};

export const findRoleReturnPermissions = async ({
    query,
}: FindRolesReturnPermissionsParams) => {
    const result = await roles().find(query, {
        projection: {
            permissions: 1,
        },
    });

    return result.toArray();
};

export const findRoleById = async ({ id }: FindRoleByIdParams) => {
    const result = await roles().findOne({ _id: new ObjectId(id) });
    return result;
};

export const findOneRole = async ({ query }: FindOneRoleParams) => {
    const result = await roles().findOne<RoleDocument>(query);
    return result;
};

export const updateRole = async ({ id, role }: UpdateRoleParams) => {
    const result = await roles().updateOne(
        { _id: new ObjectId(id) },
        { $set: role }
    );
    return result;
};

export const deleteRole = async ({ id }: DeleteRoleParams) => {
    const result = await roles().deleteOne({ _id: new ObjectId(id) });
    return result;
};
