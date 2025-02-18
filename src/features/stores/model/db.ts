import { getDb, ObjectId } from '../../../services';
import { COLLECTION_STORES, Stores, StoresSchema } from './schema';
import type {
    CheckUrlIsUniqueParams,
    FindStoresByCreatorParams,
    FindStoresPaginatedParams,
    UpdateFormatOrganizationsParams,
    UpdateStatusStoreParams,
    UpdateStepStoresParams,
    UpdateStoresParams,
} from './types';

const stores = () => getDb().collection<Stores>(COLLECTION_STORES);

export const createStores = (data: Stores) => {
    const envelope = StoresSchema.parse(data);

    return stores().insertOne(envelope);
};

export const findStoresByCreatorPaginated = ({
    query,
    skip,
    limit,
    sort,
}: FindStoresByCreatorParams) =>
    stores()
        .aggregate([
            { $match: query },
            {
                $addFields: {
                    insesitiveName: { $toLower: '$organization.name' },
                },
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
        ])
        .toArray();

export const findStoresPaginated = ({
    query,
    skip,
    limit,
    sort,
}: FindStoresPaginatedParams) =>
    stores()
        .aggregate([
            { $match: { status: query.status } },
            {
                $match: {
                    $or: [
                        {
                            'organization.name': {
                                $regex: query.search ?? '.*',
                                $options: 'i',
                            },
                        },
                        {
                            'organization.url': {
                                $regex: query.search ?? '.*',
                                $options: 'i',
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    creatorId: {
                        $toObjectId: '$framework.createdBy',
                    },
                    insensitiveName: { $toLower: '$organization.name' },
                    insensitiveUrl: { $toLower: '$organization.url' },
                },
            },
            {
                $lookup: {
                    from: 'creators',
                    localField: 'creatorId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                },
            },
            {
                $addFields: {
                    username: '$creator.username',
                    emails: '$creator.emails',
                },
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    creator: 0,
                    creatorId: 0,
                    insensitiveName: 0,
                    insensitiveUrl: 0,
                },
            },
        ])
        .toArray();

export const findStoresByHash = (hash: string) => stores().findOne({ hash });

export const findStoresById = (id: string) =>
    stores().findOne({ _id: new ObjectId(id) });

export const findStoresBySubdomain = (subdomain: string) =>
    stores().findOne({ 'organization.url': subdomain });

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

export const updateStatusStore = ({ id, status }: UpdateStatusStoreParams) =>
    stores().updateOne({ _id: new ObjectId(id) }, { $set: { status } });

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

export const CheckUrlIsUnique = async ({ id, url }: CheckUrlIsUniqueParams) =>
    stores().findOne({
        _id: { $ne: new ObjectId(id) },
        'organization.url': url,
        $or: [{ status: 'active' }, { status: 'pending' }],
    });

export const countStoresByCreator = ({
    query,
}: Pick<FindStoresByCreatorParams, 'query'>) => stores().countDocuments(query);

export const countStores = ({ query }: { query: any }) =>
    stores().countDocuments(query);
