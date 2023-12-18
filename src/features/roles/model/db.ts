import { RoleSchema, RoleDocument, COLLECTION_ROLES } from './schema';
import type {
    CreateRoleParams,
    DeleteRoleParams,
    FindOneRoleParams,
    FindRoleByIdParams,
    FindRolesParams,
    UpdateRoleParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';
import {
    createRecordFramework,
    updateRecordFramework,
} from '../../common/record';

const roles = () => getDb().collection(COLLECTION_ROLES);

// basic actions
export const createRole = async ({ role, createdBy }: CreateRoleParams) => {
    const envelope = {
        ...role,
        framework: createRecordFramework({ createdBy }),
    };
    const parsed = RoleSchema.parse(envelope);

    const result = await roles().insertOne(parsed);
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

export const findRoleById = async ({ id }: FindRoleByIdParams) => {
    const result = await roles().findOne({ _id: new ObjectId(id) });
    return result;
};

export const findOneRole = async ({ query }: FindOneRoleParams) => {
    const result = await roles().findOne<RoleDocument>(query);
    return result;
};

export const updateRole = async ({ id, role, updatedBy }: UpdateRoleParams) => {
    const envelope = {
        ...role,
        framework: updateRecordFramework({
            updatedBy,
            framework: role.framework!,
        }),
    };
    const parsed = RoleSchema.parse(envelope);
    const result = await roles().updateOne(
        { _id: new ObjectId(id) },
        { $set: parsed }
    );
    return result;
};

export const deleteRole = async ({ id }: DeleteRoleParams) => {
    const result = await roles().deleteOne({ _id: new ObjectId(id) });
    return result;
};
