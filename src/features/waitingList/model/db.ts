import {
    WaitingListSchema,
    WaitingListDocument,
    COLLECTION_WAITING_LIST,
} from './schema';
import type {
    AddToWaitingListParams,
    UpdateWaitingListParams,
    DeleteWaitingListParams,
    AddAttemptWaitingListParams,
    CheckEmailExistParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const waitingList = () =>
    getDb().collection<WaitingListDocument>(COLLECTION_WAITING_LIST);

export const addToWaitingList = async ({
    newWaiting,
}: AddToWaitingListParams) => {
    const result = await waitingList().insertOne(newWaiting);
    return result;
};

export const addMultipleToWaitingList = async (
    newWaitings: WaitingListDocument[]
) => {
    const result = await waitingList().insertMany(newWaitings);
    return result;
};

export const getWaitingList = async () => {
    const result = await waitingList().find().toArray();
    return result;
};

export const updateWaitingList = async ({
    id,
    waitingItem,
}: UpdateWaitingListParams) => {
    const result = await waitingList().updateOne(
        { _id: new ObjectId(id) },
        { $set: waitingItem }
    );
    return result;
};

export const deleteWaitingList = async ({ id }: DeleteWaitingListParams) => {
    const result = await waitingList().deleteOne({ _id: new ObjectId(id) });
    return result;
};

export const createAttemptWaitingList = async ({
    email,
}: AddAttemptWaitingListParams) => {
    const newData = WaitingListSchema.parse({
        email,
        attempts: 1,
        attemptDates: [new Date()],
    });

    const result = await waitingList().insertOne({
        _id: new ObjectId(),
        ...newData,
    });

    return result;
};

export const updateAttemptWaitingList = async ({
    email,
}: AddAttemptWaitingListParams) => {
    const res = await waitingList().updateOne(
        { email },
        { $inc: { attempts: 1 }, $push: { attemptDates: new Date() } }
    );

    return res;
};

export const checkEmailExist = async ({ email }: CheckEmailExistParams) => {
    const result = await waitingList().countDocuments({ email });
    return result;
};
