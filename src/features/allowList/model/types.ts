import { AllowListDocument } from './schema';
import { ObjectId } from '../../../services/mongo';

export interface AddToAllowListParams {
    newAllow: AllowListDocument;
}

export interface UpdateAllowListParams {
    id: string | ObjectId;
    allow: AllowListDocument;
}

export interface DeleteAllowListParams {
    id: string | ObjectId;
}

export interface CheckEmailExistParams {
    email: string;
}
