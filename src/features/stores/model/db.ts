import { getDb, ObjectId } from '../../../services';
import { statusMapper } from '../controller/core';
import { COLLECTION_STORES, Stores, StoresSchema } from './schema';
import type {
    CheckUrlIsUniqueParams,
    FindStoresByCreatorParams,
    FindStoresMissingSpotlightParams,
    FindStoresPaginatedParams,
    UpdateFormatOrganizationsParams,
    UpdateStatusStoreParams,
    UpdateStatusStoresFromCreatorParams,
    UpdateStepStoresParams,
    UpdateStoresParams,
} from './types';

const stores = () => getDb().collection<Stores>(COLLECTION_STORES);

export const findStoresToSpotlight = () =>
    stores()
        .find({
            'actions.spotlight': { $exists: true, $eq: true },
            'actions.displaySpotlight': { $exists: false },
            status: 'active',
        })
        .limit(50)
        .toArray();

export const findStoresMissingSpotlight = ({
    ids,
    limit,
}: FindStoresMissingSpotlightParams) =>
    stores()
        .find({
            _id: { $nin: ids.map((id) => new ObjectId(id)) },
            'actions.spotlight': { $exists: true, $eq: true },
            'actions.displaySpotlight': { $exists: false },
            status: 'active',
        })
        .limit(limit)
        .toArray();

export const countStoresToSpotlight = () =>
    stores().countDocuments({
        'actions.spotlight': { $exists: true, $eq: true },
        'actions.displaySpotlight': { $exists: false },
        status: 'active',
    });

export const clearSpotlight = () =>
    stores().updateMany(
        { 'actions.displaySpotlight': { $exists: true, $eq: true } },
        { $unset: { 'actions.displaySpotlight': '' } }
    );

export const updateDisplaySpotlight = (ids: string[]) =>
    stores().updateMany(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        { $set: { 'actions.displaySpotlight': true } }
    );

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
            { $match: statusMapper[query.status as keyof typeof statusMapper] },
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

export const updateStatusStoresFromCreator = ({
    id,
    status,
}: UpdateStatusStoresFromCreatorParams) =>
    stores().updateOne({ _id: new ObjectId(id) }, { $set: { status } });

export const updateStatusStore = ({
    id,
    status,
    moderatorId,
}: UpdateStatusStoreParams) =>
    stores().updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                status,
                moderation: {
                    owner: moderatorId,
                    createdAt: new Date(),
                },
            },
        }
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
