import {
    PermissionSchema,
    PermissionDocument,
    COLLECTION_PERMISSIONS,
} from './schema';
import type {
    CreatePermissionParams,
    DeletePermissionParams,
    FindOnePermissionParams,
    FindPermissionByIdParams,
    FindPermissionsParams,
    UpdatePermissionParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';
import {
    createRecordFramework,
    updateRecordFramework,
} from '../../common/record';

const permissions = () => getDb().collection(COLLECTION_PERMISSIONS);

// basic actions
export const createPermission = async ({
    permission,
    createdBy,
}: CreatePermissionParams) => {
    try {
        const envelope = {
            ...permission,
            framework: createRecordFramework({ createdBy }),
        };
        const parsed = PermissionSchema.parse(envelope);

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
    updatedBy,
}: UpdatePermissionParams) => {
    const envelope = {
        ...permission,
        framework: updateRecordFramework({
            updatedBy,
            framework: permission.framework!,
        }),
    };
    const parsed = PermissionSchema.parse(envelope);
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
