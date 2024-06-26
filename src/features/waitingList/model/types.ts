import { WaitingListDocument } from './schema';
import { ObjectId } from '../../../services/mongo';

export interface AddToWaitingListParams {
    newWaiting: WaitingListDocument;
}

export interface FindWaitingListParams {
    query: any;
    sort: any;
    skip: number;
    limit?: number;
}
export interface UpdateWaitingListParams {
    id: string | ObjectId;
    waitingItem: WaitingListDocument;
}

export interface DeleteWaitingListParams {
    id: string | ObjectId;
}

export interface AddAttemptWaitingListParams {
    email: string;
}

export interface CheckEmailExistParams {
    email: string;
}
