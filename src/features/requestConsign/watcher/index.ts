import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_REQUEST_CONSIGNS, RequestConsignDocument } from '../model';
import emitter from '../../events';

const logger = debug('features:requestConsign:watcher');

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(async () => {
            logger('Watching changes in requestConsign');

            const changeStream = getDb()
                .collection<RequestConsignDocument>(COLLECTION_REQUEST_CONSIGNS)
                .watch([], { fullDocument: 'updateLookup' });

            changeStream.on('change', (change) => {
                if (change.operationType === 'insert') {
                    if (!change.fullDocument) return;
                    emitter.emitCreateRequestConsign(change.fullDocument);
                }
            });
        }).catch((error) => {
            captureException(error, { tags: { scope: 'requestConsign' } });
            logger('Error watching changes in requestConsign: %O', error);
            exitWithDelay({});
        });
    },
});
