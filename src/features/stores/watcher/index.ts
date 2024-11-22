import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import crypto from 'crypto';

import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_STORES, StoresDocument } from '../model';

const logger = debug('features:stores:watcher');

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in stores');

                const changeStream = getDb()
                    .collection<StoresDocument>(COLLECTION_STORES)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE STORES
                    if (change.operationType === 'update') {
                        if (!change.fullDocument) return;

                        if (change.fullDocument?.organization?.url) {
                            logger(
                                'Updating hash for store: %s',
                                change.fullDocument._id
                            );

                            // generate hash SHA-256
                            const hash = crypto
                                .createHash('sha256')
                                .update(change.fullDocument.organization.url)
                                .digest('hex');

                            await getDb()
                                .collection<StoresDocument>(COLLECTION_STORES)
                                .updateOne(
                                    { _id: change.fullDocument._id },
                                    { $set: { hash } }
                                );
                        }
                    }

                    // OPERATION TYPE: INSERT STORES
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        if (change.fullDocument?.organization?.url) {
                            logger(
                                'Updating hash for store: %s',
                                change.fullDocument._id
                            );

                            // generate hash SHA-256
                            const hash = crypto
                                .createHash('sha256')
                                .update(change.fullDocument.organization.url)
                                .digest('hex');

                            await getDb()
                                .collection<StoresDocument>(COLLECTION_STORES)
                                .updateOne(
                                    { _id: change.fullDocument._id },
                                    { $set: { hash } }
                                );
                        }
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: stores'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'stores' } });
            logger('Error watching changes in stores: %O', error);
            exitWithDelay({});
        });
    },
});
