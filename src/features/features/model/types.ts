import { FeatureDocument } from './schema';
import { ObjectId } from '../../../services/mongo';

export interface AddFeatureParams {
    newFeature: FeatureDocument;
}

export interface UpdateFeatureParams {
    id: string | ObjectId;
    feature: FeatureDocument;
}

export interface DeleteFeatureParams {
    id: string | ObjectId;
}

export interface CheckEmailExistParams {
    email: string;
}
