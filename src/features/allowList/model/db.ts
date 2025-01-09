import { AllowListDocument, COLLECTION_ALLOW_LIST } from './schema';
import type {
    AddToAllowListParams,
    CheckEmailExistParams,
    DeleteAllowListParams,
    UpdateAllowListParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const allowList = () =>
    getDb().collection<AllowListDocument>(COLLECTION_ALLOW_LIST);

export const addToAllowList = async ({ newAllow }: AddToAllowListParams) => {
    const result = await allowList().insertOne(newAllow);
    return result;
};

export const addMultipleToAllowList = async (
    newAllows: AllowListDocument[]
) => {
    const result = await allowList().insertMany(newAllows, { ordered: false });
    return result;
};
export const getAllowList = async () => {
    const result = await allowList().find().toArray();
    return result;
};

export const updateAllowList = async ({ id, allow }: UpdateAllowListParams) => {
    const result = await allowList().updateOne(
        { _id: new ObjectId(id) },
        { $set: allow }
    );
    return result;
};

export const deleteAllowList = async ({ id }: DeleteAllowListParams) => {
    const result = await allowList().deleteOne({ _id: new ObjectId(id) });
    return result;
};

export const checkEmailExist = async ({ email }: CheckEmailExistParams) => {
    const result = await allowList().countDocuments({ email });
    return result;
};
