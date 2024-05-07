import { uniqueExecution } from '@nsfilho/unique';
import debug from 'debug';

import * as model from '../model';
import { exitWithDelay, retry } from '../../../utils';
import { captureException, getDb } from '../../../services';
import { sendToExchangeAssets } from '../queue';

const logger = debug('features:assets:watcher');

uniqueExecution({
    name: __filename,
    callback: () =>
        retry(
            async () => {
                const changeStream = getDb()
                    .collection<model.AssetsDocument>(model.COLLECTION_ASSETS)
                    .watch<model.AssetsDocument>([], {
                        fullDocument: 'updateLookup',
                    });

                changeStream.on('change', (change) => {
                    if (change.operationType === 'replace') {
                        // update asset
                        sendToExchangeAssets(
                            JSON.stringify(change.fullDocument),
                            'replace'
                        );
                    }
                    if (change.operationType === 'insert') {
                        // insert asset
                        sendToExchangeAssets(
                            JSON.stringify(change.fullDocument),
                            'insert'
                        );
                    }
                    if (change.operationType === 'delete') {
                        // delete asset
                        sendToExchangeAssets(
                            JSON.stringify(change.documentKey),
                            'delete'
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: assets'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'assets' } });
            logger('Error watching changes in assets: %O', error);
            exitWithDelay({});
        }),
    advanced: {
        blockExecution: false,
        delay: 1000,
        priority: 20,
    },
});
