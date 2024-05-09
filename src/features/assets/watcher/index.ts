import debug from 'debug';
import { uniqueExecution } from '@nsfilho/unique';
import { exitWithDelay, retry } from '../../../utils';
import { captureException, getDb } from '../../../services';
import { COLLECTION_ASSETS } from '../model';
import { sendToExchangeRSS } from '../../../services/rss';

const logger = debug('features:assets:watcher');

uniqueExecution({
    name: __filename,
    callback: () =>
        retry(
            async () => {
                logger('Watching changes in assets');

                const changeStream = getDb()
                    .collection(COLLECTION_ASSETS)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', (change) => {
                    if (change.operationType === 'delete') {
                        // dispatch queue to remove asset from rss
                        sendToExchangeRSS(
                            JSON.stringify({
                                id: change.documentKey._id.toString(),
                            }),
                            'remove'
                        );
                    }

                    if (
                        change.operationType === 'replace' ||
                        change.operationType === 'update'
                    ) {
                        // check consign artwork status
                        if (
                            change.fullDocumentBeforeChange?.consignArtwork
                                .status !==
                                change.fullDocument?.consignArtwork.status &&
                            change.fullDocument?.consignArtwork.status !==
                                'active'
                        ) {
                            // dispatch queue to remove from rss
                            sendToExchangeRSS(
                                JSON.stringify({
                                    id: change.documentKey._id.toString(),
                                }),
                                'remove'
                            );
                        }
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: assets'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'profiles' } });
            logger('Error watching changes in profiles: %O', error);
            exitWithDelay({});
        }),
});
