import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_USERS, UserDocument } from '../model';
import { emitter } from '../../events';

const logger = debug('features:users:watcher');

interface StatusProps {
    data: UserDocument[];
}

export const status: StatusProps = {
    data: [],
};

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in users');

                const userss = (await getDb()
                    .collection<UserDocument>(COLLECTION_USERS)
                    .find({})
                    .toArray()) as UserDocument[];
                status.data = userss;

                emitter.on(emitter.INITIAL_USERS, () => {
                    emitter.emit(emitter.LIST_USERS, status.data);
                });

                const changeStream = getDb()
                    .collection<UserDocument>(COLLECTION_USERS)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE USER
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

                        emitter.emitUpdateUser(change.fullDocument);
                    }

                    // OPERATION TYPE: INSERT USER
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        status.data.push(change.fullDocument);
                        emitter.emitCreateUser(change.fullDocument);
                    }

                    // OPERATION TYPE: DELETE USER
                    if (change.operationType === 'delete') {
                        status.data = status.data.filter(
                            (item) => item._id !== change.documentKey._id
                        );

                        emitter.emitDeleteUser(
                            change.documentKey._id.toString()
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: users'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'users' } });
            logger('Error watching changes in users: %O', error);
            exitWithDelay({});
        });
    },
});
