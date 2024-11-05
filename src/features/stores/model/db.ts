import { getDb, ObjectId } from '../../../services';
import { COLLECTION_STORES, Stores, StoresSchema } from './schema';
import type {
    UpdateFormatOrganizationsParams,
    UpdateStepStoresParams,
    UpdateStoresParams,
} from './types';

const stores = () => getDb().collection<Stores>(COLLECTION_STORES);

export const createStores = (data: Stores) => {
    const envelope = StoresSchema.parse(data);

    return stores().insertOne(envelope);
};

export const findStoresByCreator = (creator: string) =>
    stores().find({ 'framework.createdBy': creator }).toArray();

export const findStoresById = (id: string) =>
    stores().findOne({ _id: new ObjectId(id) });

export const updateStores = ({ id, data }: UpdateStoresParams) => {
    const envelope = StoresSchema.parse(data);

    return stores().updateOne({ _id: new ObjectId(id) }, { $set: envelope });
};

export const deleteStores = (id: string) =>
    stores().deleteOne({ _id: new ObjectId(id) });

export const updateStepStores = ({
    id,
    stepName,
    data,
}: UpdateStepStoresParams) =>
    stores().updateOne(
        { _id: new ObjectId(id) },
        { $set: { [stepName]: data } }
    );

export const updateFormatOrganizations = ({
    id,
    format,
    data,
}: UpdateFormatOrganizationsParams) =>
    stores().updateOne(
        { _id: new ObjectId(id) },
        {
            $set: { [`organization.formats.${format}`]: data },
        }
    );
