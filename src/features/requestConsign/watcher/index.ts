import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { ObjectId, getDb } from '../../../services';
import { COLLECTION_REQUEST_CONSIGNS, RequestConsignDocument } from '../model';
import { emitter } from '../../events';
import { COLLECTION_ASSETS } from '../../assets/model';
import { COLLECTION_CREATORS } from '../../creators/model';
import { RequestConsignProps } from './types';

const logger = debug('features:requestConsign:watcher');

interface StatusProps {
    data: RequestConsignProps[];
}

export const status: StatusProps = {
    data: [],
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
                    const index = status.data.findIndex(
                        (element) =>
                            element.creator._id.toString() ===
                            creatorUpdated._id.toString()
                    );
                    if (index === -1) return;
                    status.data[index].creator = {
                        _id: creatorUpdated._id.toString(),
                        username: creatorUpdated.username,
                        emails: creatorUpdated.emails,
                    };

                    emitter.emitUpdateRequestConsign(status.data[index]);
                });

                const changeStream = getDb()
                    .collection<RequestConsignDocument>(
                        COLLECTION_REQUEST_CONSIGNS
                    )
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
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
                        status.data[index].comments = requestUpdated.comments;
                        status.data[index].status = requestUpdated.status;
                        status.data[index].logs = requestUpdated.logs;
                        emitter.emitUpdateRequestConsign(status.data[index]);
                    }

                    // OPERATION TYPE: INSERT REQUEST CONSIGN
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        const asset = await getDb()
                            .collection(COLLECTION_ASSETS)
                            .findOne(
                                {
                                    _id: new ObjectId(
                                        change.fullDocument.asset
                                    ),
                                },
                                {
                                    projection: {
                                        _id: 1,
                                        'assetMetadata.context.formData.title': 1,
                                    },
                                }
                            );
                        const creator = await getDb()
                            .collection(COLLECTION_CREATORS)
                            .findOne(
                                {
                                    _id: new ObjectId(
                                        change.fullDocument.creator
                                    ),
                                },
                                {
                                    projection: {
                                        _id: 1,
                                        username: 1,
                                        emails: 1,
                                    },
                                }
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
