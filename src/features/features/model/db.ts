import { FeatureDocument, COLLECTION_FEATURES } from './schema';
import type {
    AddFeatureParams,
    CheckEmailExistParams,
    DeleteFeatureParams,
    UpdateFeatureParams,
} from './types';
import { getDb, ObjectId } from '../../../services/mongo';

const features = () => getDb().collection<FeatureDocument>(COLLECTION_FEATURES);

export const addFeature = async ({ newFeature }: AddFeatureParams) => {
    const result = await features().insertOne(newFeature);
    return result;
};

export const getFeatures = async () => {
    const result = await features().find().toArray();
    return result;
};

export const updateFeature = async ({ id, feature }: UpdateFeatureParams) => {
    const result = await features().updateOne(
        { _id: new ObjectId(id) },
        { $set: feature }
    );
    return result;
};

export const deleteFeature = async ({ id }: DeleteFeatureParams) => {
    const result = await features().deleteOne({ _id: new ObjectId(id) });
    return result;
};

export const checkEmailExist = async ({ email }: CheckEmailExistParams) => {
    const result = await features().find({ emails: email }).toArray();
    return result;
};
