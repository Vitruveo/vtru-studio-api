import { COLLECTION_REQUEST_CONSIGNS, RequestConsignDocument } from './schema';
import { getDb, ObjectId } from '../../../services/mongo';
import {
    CreateRequestConsignParams,
    FindOneRequestConsignByCreatorParams,
    FindOneRequestConsignParams,
    FindRequestConsignByIdParams,
    FindRequestConsignsByIdsParams,
    FindRequestConsignsParams,
    UpdateRequestConsignParams,
} from './types';

const requestConsigns = () => getDb().collection(COLLECTION_REQUEST_CONSIGNS);

export const createRequestConsign = async ({
    requestConsign,
}: CreateRequestConsignParams) => {
    try {
        try {
            const result = await requestConsigns().insertOne(requestConsign);

            return result;
        } catch (mongodbError) {
            // return mongodb error
            return mongodbError;
        }
    } catch (zodError) {
        // return zod error
        return zodError;
    }
};

export const findRequestConsigns = async ({
    query,
    skip,
    sort,
    limit,
}: FindRequestConsignsParams) => {
    let result = requestConsigns().find(query, {}).sort(sort).skip(skip);
    if (limit) result = result.limit(limit);

    return result.stream();
};

export const findRequestConsignsByIds = async ({
    ids,
}: FindRequestConsignsByIdsParams) => {
    const result = await requestConsigns().find(
        {
            _id: {
                $in: ids.map((id) => new ObjectId(id)),
            },
        },
        { projection: { key: 1 } }
    );

    return result.toArray();
};

export const findRequestConsignsById = async ({
    id,
}: FindRequestConsignByIdParams) => {
    const result = await requestConsigns().findOne({
        _id: new ObjectId(id),
    });

    return result;
};

export const findOneRequestConsign = async ({
    query,
}: FindOneRequestConsignParams) => {
    const result =
        await requestConsigns().findOne<RequestConsignDocument>(query);
    return result;
};

export const findRequestConsignsByCreator = async ({
    creator,
}: FindOneRequestConsignByCreatorParams) => {
    const result = requestConsigns().findOne<RequestConsignDocument>({
        creator,
    });

    return result;
};

export const updateRequestConsign = async ({
    id,
    requestConsign,
}: UpdateRequestConsignParams) => {
    const result = await requestConsigns().updateOne(
        { _id: new ObjectId(id) },
        { $set: requestConsign }
    );
    return result;
};
