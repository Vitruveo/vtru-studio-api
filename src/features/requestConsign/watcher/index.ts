import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { ObjectId, getDb } from '../../../services';
import {
    COLLECTION_REQUEST_CONSIGNS,
    RequestConsignDocument,
    updateRequestConsign,
} from '../model';
import { emitter } from '../../events';
import {
    COLLECTION_ASSETS,
    countAssetConsignedByCreator,
} from '../../assets/model';
import { COLLECTION_CREATORS } from '../../creators/model';
import { RequestConsignProps } from './types';
import { sendToExchangeAutoConsign } from '../../../services/autoConsign';

const logger = debug('features:requestConsign:watcher');

interface StatusProps {
    data: RequestConsignProps[];
}

export const status: StatusProps = {
    data: [],
};

const getAsset = (assetId: string) =>
    getDb()
        .collection(COLLECTION_ASSETS)
        .findOne(
            {
                _id: new ObjectId(assetId),
            },
            {
                projection: {
                    _id: 1,
                    'assetMetadata.context.formData.title': 1,
                },
            }
        );

const getCreator = (creatorId: string) =>
    getDb()
        .collection(COLLECTION_CREATORS)
        .findOne(
            {
                _id: new ObjectId(creatorId),
            },
            {
                projection: {
                    _id: 1,
                    username: 1,
                    emails: 1,
                    vault: 1,
                },
            }
        );

const sendToConsign = async ({
    creator,
    asset,
    requestConsignId,
}: {
    creator: any;
    asset: any;
    requestConsignId: string;
}) => {
    if (!creator?.vault) {
        logger(`Creator vault is missing for ${creator._id.toString()}`);
        return;
    }

    // check if creator has field isBlocked
    if ('isBlocked' in creator.vault) {
        // check if creator is not blocked
        if (!creator.vault.isBlocked) {
            const countAssetConsigned = await countAssetConsignedByCreator({
                creatorId: creator._id.toString(),
            });

            // check if creator has more than 1 asset consigned
            if (countAssetConsigned >= 1) {
                await sendToExchangeAutoConsign(
                    JSON.stringify({
                        assetId: asset._id.toString(),
                    })
                );

                await updateRequestConsign({
                    id: requestConsignId,
                    requestConsign: {
                        status: 'queue',
                    },
                });
            } else {
                logger(
                    `Creator ${creator._id.toString()} not have more than 1 asset consigned`
                );
            }
        }
    }
};

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in requestConsign');

                const requestConsigns = (await getDb()
                    .collection<RequestConsignDocument>(
                        COLLECTION_REQUEST_CONSIGNS
                    )
                    .aggregate([
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
                                logs: 1,
                                comments: 1,
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
                    ])
                    .toArray()) as RequestConsignProps[];
                status.data = requestConsigns;
                emitter.on(emitter.INITIAL_REQUEST_CONSIGNS, () => {
                    emitter.emit(emitter.LIST_REQUEST_CONSIGNS, status.data);
                });
                emitter.on(emitter.UPDATED_CREATOR, (creatorUpdated) => {
                    const indexes = status.data.reduce(
                        (acc: number[], element, i) => {
                            if (
                                element.creator._id.toString() ===
                                creatorUpdated._id.toString()
                            ) {
                                acc.push(i);
                            }
                            return acc;
                        },
                        []
                    );
                    indexes.forEach((index) => {
                        status.data[index].creator = {
                            _id: creatorUpdated._id.toString(),
                            username: creatorUpdated.username,
                            emails: creatorUpdated.emails,
                        };
                        emitter.emitUpdateRequestConsign(status.data[index]);
                    });
                });

                const changeStream = getDb()
                    .collection<RequestConsignDocument>(
                        COLLECTION_REQUEST_CONSIGNS
                    )
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    try {
                        // OPERATION TYPE: UPDATE REQUEST CONSIGN
                        if (change.operationType === 'update') {
                            if (!change.fullDocument) return;
                            const requestUpdated = change.fullDocument;
                            const index = status.data.findIndex(
                                (element) =>
                                    element._id.toString() ===
                                    requestUpdated._id.toString()
                            );
                            if (index === -1) return;
                            status.data[index].comments =
                                requestUpdated.comments;
                            status.data[index].status = requestUpdated.status;
                            status.data[index].logs = requestUpdated.logs;
                            emitter.emitUpdateRequestConsign(
                                status.data[index]
                            );

                            const requestStatus =
                                change.updateDescription.updatedFields?.status;

                            if (requestStatus && requestStatus === 'pending') {
                                const asset = await getAsset(
                                    change.fullDocument.asset
                                );
                                const creator = await getCreator(
                                    change.fullDocument.creator
                                );

                                if (!asset || !creator) {
                                    logger(
                                        `Asset (${change.fullDocument.asset}) or Creator (${change.fullDocument.creator}) not found`
                                    );

                                    return;
                                }

                                if (!creator?.vault) {
                                    logger(
                                        `Creator vault is missing for ${creator._id.toString()}`
                                    );
                                    return;
                                }

                                // check if creator has field isBlocked
                                await sendToConsign({
                                    creator,
                                    asset,
                                    requestConsignId:
                                        change.fullDocument._id.toString(),
                                });
                            }
                        }

                        // OPERATION TYPE: INSERT REQUEST CONSIGN
                        if (change.operationType === 'insert') {
                            if (!change.fullDocument) return;

                            const asset = await getAsset(
                                change.fullDocument.asset
                            );
                            const creator = await getCreator(
                                change.fullDocument.creator
                            );

                            if (!asset || !creator) return;

                            const data = {
                                _id: change.fullDocument._id.toString(),
                                status: change.fullDocument.status,
                                logs: change.fullDocument.logs,
                                asset: {
                                    _id: asset._id.toString(),
                                    title: asset.assetMetadata.context.formData
                                        .title,
                                },
                                creator: {
                                    _id: creator._id.toString(),
                                    username: creator.username,
                                    emails: creator.emails,
                                },
                            };

                            status.data.push(data);
                            emitter.emitCreateRequestConsign(data);

                            // rules auto consign

                            logger(
                                `Checking auto consign rules for asset: ${asset._id.toString()}`
                            );
                            await sendToConsign({
                                creator,
                                asset,
                                requestConsignId:
                                    change.fullDocument._id.toString(),
                            });
                        }

                        // OPERATION TYPE: DELETE REQUEST CONSIGN
                        if (change.operationType === 'delete') {
                            status.data = status.data.filter(
                                (item) =>
                                    item._id.toString() !==
                                    change.documentKey._id.toString()
                            );

                            emitter.emitDeleteRequestConsign(
                                change.documentKey._id.toString()
                            );
                        }
                    } catch (error) {
                        logger(
                            'Error watching changes in requestConsign: %O',
                            error
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: request consigns'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'requestConsign' } });
            logger('Error watching changes in requestConsign: %O', error);
            exitWithDelay({});
        });
    },
});
