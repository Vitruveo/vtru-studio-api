import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_ROLES, RoleDocument } from '../model';
import { emitter } from '../../events';

const logger = debug('features:roles:watcher');

interface StatusProps {
    data: RoleDocument[];
}

export const status: StatusProps = {
    data: [],
};

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in roles');

                const roless = (await getDb()
                    .collection<RoleDocument>(COLLECTION_ROLES)
                    .find({})
                    .toArray()) as RoleDocument[];
                status.data = roless;

                emitter.on(emitter.INITIAL_ROLES, () => {
                    emitter.emit(emitter.LIST_ROLES, status.data);
                });

                const changeStream = getDb()
                    .collection<RoleDocument>(COLLECTION_ROLES)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE ROLE
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

                        emitter.emitUpdateRole(change.fullDocument);
                    }

                    // OPERATION TYPE: INSERT ROLE
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        status.data.push(change.fullDocument);
                        emitter.emitCreateRole(change.fullDocument);
                    }

                    // OPERATION TYPE: DELETE ROLE
                    if (change.operationType === 'delete') {
                        status.data = status.data.filter(
                            (item) => item._id !== change.documentKey._id
                        );

                        emitter.emitDeleteRole(
                            change.documentKey._id.toString()
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: roles'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'roles' } });
            logger('Error watching changes in roles: %O', error);
            exitWithDelay({});
        });
    },
});
