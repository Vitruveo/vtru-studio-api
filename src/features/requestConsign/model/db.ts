import {
    COLLECTION_REQUEST_CONSIGNS,
    RequestConsignDocument,
    RequestConsign,
} from './schema';
import { getDb, ObjectId } from '../../../services/mongo';
import {
    CreateRequestConsignParams,
    FindOneRequestConsignByCreatorParams,
    FindOneRequestConsignParams,
    FindRequestConsignByIdParams,
    FindRequestConsignsByIdsParams,
    FindRequestConsignsParams,
    UpdateRequestConsignStatusParams,
} from './types';

const requestConsigns = () =>
    getDb().collection<RequestConsign>(COLLECTION_REQUEST_CONSIGNS);

export const createRequestConsign = ({
    requestConsign,
}: CreateRequestConsignParams) => requestConsigns().insertOne(requestConsign);

export const findRequestConsigns = ({
    query,
    skip,
    sort,
    limit,
}: FindRequestConsignsParams) => {
    let result = requestConsigns().aggregate([
        { $match: query },
        {
            $addFields: {
                asset: { $toObjectId: '$asset' },
                creator: { $toObjectId: '$creator' },
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creator',
                foreignField: '_id',
                as: 'creator',
            },
        },
        { $unwind: '$asset' },
        { $unwind: '$creator' },
        {
            $project: {
                _id: 1,
                status: 1,
                asset: {
                    _id: 1,
                    title: '$asset.assetMetadata.context.formData.title',
                },
                creator: {
                    _id: 1,
                    username: '$creator.username',
                    emails: '$creator.emails',
                },
            },
        },
        {
            $sort: sort,
        },
        {
            $skip: skip,
        },
    ]);
    if (limit) result = result.limit(limit);

    return result.stream();
};

export const findRequestConsignsByIds = ({
    ids,
}: FindRequestConsignsByIdsParams) =>
    requestConsigns()
        .find(
            {
                _id: {
                    $in: ids.map((id) => new ObjectId(id)),
                },
            },
            { projection: { key: 1 } }
        )
        .toArray();

export const findRequestConsignsById = ({ id }: FindRequestConsignByIdParams) =>
    requestConsigns().findOne({
        _id: new ObjectId(id),
    });

export const findOneRequestConsign = ({ query }: FindOneRequestConsignParams) =>
    requestConsigns().findOne<RequestConsignDocument>(query);

export const findRequestConsignsByCreator = ({
    creator,
}: FindOneRequestConsignByCreatorParams) =>
    requestConsigns().findOne<RequestConsignDocument>({
        creator,
    });

export const updateRequestConsign = ({
    id,
    requestConsignStatus,
}: UpdateRequestConsignStatusParams) =>
    requestConsigns().updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                status: requestConsignStatus,
            },
        }
    );
