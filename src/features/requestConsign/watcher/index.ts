import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_REQUEST_CONSIGNS, RequestConsignDocument } from '../model';
import { emitter } from '../emitter';

const logger = debug('features:requestConsign:watcher');

interface StatusProps {
    data: RequestConsignDocument[];
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
                    .toArray()) as RequestConsignDocument[];
                status.data = requestConsigns;
                emitter.on('initial', () => {
                    emitter.emit('requestConsigns', status.data);
                });

                const changeStream = getDb()
                    .collection<RequestConsignDocument>(
                        COLLECTION_REQUEST_CONSIGNS
                    )
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', (change) => {
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;
                        status.data.push(change.fullDocument);

                        emitter.emitCreateRequestConsign(change.fullDocument);
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
