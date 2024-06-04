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
    UpdateRequestConsignParams,
} from './types';

const requestConsigns = () =>
    getDb().collection<RequestConsign>(COLLECTION_REQUEST_CONSIGNS);

export const createRequestConsign = async ({
    requestConsign,
}: CreateRequestConsignParams) => requestConsigns().insertOne(requestConsign);

export const findRequestConsigns = ({
    query,
    skip,
    sort,
    limit,
}: FindRequestConsignsParams) => {
    let result = requestConsigns().find(query, {}).sort(sort).skip(skip);
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
    requestConsign,
}: UpdateRequestConsignParams) =>
    requestConsigns().updateOne(
        { _id: new ObjectId(id) },
        { $set: requestConsign }
    );
