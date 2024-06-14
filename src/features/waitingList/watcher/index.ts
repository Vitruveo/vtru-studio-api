import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_WAITING_LIST, WaitingListDocument } from '../model';
import { emitter } from '../../events';

const logger = debug('features:waitingList:watcher');

interface StatusProps {
    data: WaitingListDocument[];
}

export const status: StatusProps = {
    data: [],
};

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in waitingList');

                const waitingLists = (await getDb()
                    .collection<WaitingListDocument>(COLLECTION_WAITING_LIST)
                    .find({})
                    .toArray()) as WaitingListDocument[];
                status.data = waitingLists;

                emitter.on(emitter.INITIAL_WAITING_LIST, () => {
                    emitter.emit(emitter.LIST_WAITING_LIST, status.data);
                });

                const changeStream = getDb()
                    .collection<WaitingListDocument>(COLLECTION_WAITING_LIST)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE WAITING LIST
                    if (change.operationType === 'update') {
                        if (!change.fullDocument) return;

                        const index = status.data.findIndex(
                            (item) => item._id === change.documentKey._id
                        );
                        if (index !== -1) {
                            status.data[index] = change.fullDocument;
                        } else {
                            status.data.push(change.fullDocument);
                        }

                        emitter.emitUpdateWaitingList(change.fullDocument);
                    }

                    // OPERATION TYPE: INSERT WAITING LIST
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        status.data.push(change.fullDocument);
                        emitter.emitCreateWaitingList(change.fullDocument);
                    }

                    // OPERATION TYPE: DELETE WAITING LIST
                    if (change.operationType === 'delete') {
                        status.data = status.data.filter(
                            (item) => item._id !== change.documentKey._id
                        );

                        emitter.emitDeleteWaitingList(
                            change.documentKey._id.toString()
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: waitingList'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'waitingList' } });
            logger('Error watching changes in waitingList: %O', error);
            exitWithDelay({});
        });
    },
});
