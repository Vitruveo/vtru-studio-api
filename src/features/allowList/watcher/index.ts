import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_ALLOW_LIST, AllowListDocument } from '../model';
import { emitter } from '../../events';

const logger = debug('features:allowList:watcher');

interface StatusProps {
    data: AllowListDocument[];
}

export const status: StatusProps = {
    data: [],
};

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in allowList');

                const allowLists = (await getDb()
                    .collection<AllowListDocument>(COLLECTION_ALLOW_LIST)
                    .find({})
                    .toArray()) as AllowListDocument[];
                status.data = allowLists;

                emitter.on(emitter.INITIAL_ALLOW_LIST, () => {
                    emitter.emit(emitter.LIST_ALLOW_LIST, status.data);
                });

                const changeStream = getDb()
                    .collection<AllowListDocument>(COLLECTION_ALLOW_LIST)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE ALLOW LIST
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

                        emitter.emitUpdateAllowList(change.fullDocument);
                    }

                    // OPERATION TYPE: INSERT ALLOW LIST
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        status.data.push(change.fullDocument);
                        emitter.emitCreateAllowList(change.fullDocument);
                    }

                    // OPERATION TYPE: DELETE ALLOW LIST
                    if (change.operationType === 'delete') {
                        status.data = status.data.filter(
                            (item) => item._id !== change.documentKey._id
                        );

                        emitter.emitDeleteAllowList(
                            change.documentKey._id.toString()
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: allowList'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'allowList' } });
            logger('Error watching changes in allowList: %O', error);
            exitWithDelay({});
        });
    },
});
