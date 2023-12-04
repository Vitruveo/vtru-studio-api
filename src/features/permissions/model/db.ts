import {
    PermissionSchema,
    PermissionDocument,
    COLLECTION_PERMISSIONS,
} from './schema';

import {
    CreatePermissionParams,
    DeletePermissionParams,
    FindOnePermissionParams,
    FindPermissionByIdParams,
    FindPermissionsParams,
    UpdatePermissionParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const permissions = () => getDb().collection(COLLECTION_PERMISSIONS);

// basic actions
export const createPermission = async ({
    permission,
}: CreatePermissionParams) => {
    try {
        const parsed = PermissionSchema.parse(permission);

        try {
            const result = await permissions().insertOne(parsed);

            return result;
        } catch (mongodbError) {
            // return mongodb error
            return mongodbError;
        }
    } catch (zodError) {
        // return zod error
        return zodError;
    }
};

// return a stream of Permissions from database
export const findPermissions = async ({
    query,
    sort,
    skip,
    limit,
}: FindPermissionsParams) => {
    let result = permissions().find(query, {}).sort(sort).skip(skip);

    if (limit) result = result.limit(limit);

    return result.stream();
};

export const findPermissionById = async ({ id }: FindPermissionByIdParams) => {
    const result = await permissions().findOne({ _id: new ObjectId(id) });
    return result;
};

export const findOnePermission = async ({ query }: FindOnePermissionParams) => {
    const result = await permissions().findOne<PermissionDocument>(query);
    return result;
};

export const updatePermission = async ({
    id,
    permission,
}: UpdatePermissionParams) => {
    const parsed = PermissionSchema.parse(permission);
    const result = await permissions().updateOne(
        { _id: new ObjectId(id) },
        { $set: parsed }
    );
    return result;
};

export const deletePermission = async ({ id }: DeletePermissionParams) => {
    const result = await permissions().deleteOne({ _id: new ObjectId(id) });
    return result;
};
