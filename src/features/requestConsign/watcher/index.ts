import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_REQUEST_CONSIGNS, RequestConsignDocument } from '../model';
import emitter from '../../events';

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

                const requestConsigns = await getDb()
                    .collection<RequestConsignDocument>(
                        COLLECTION_REQUEST_CONSIGNS
                    )
                    .find()
                    .toArray();
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
