import { uniqueExecution } from '@nsfilho/unique';
import { captureException } from '@sentry/node';
import debug from 'debug';
import { exitWithDelay, retry } from '../../../utils';
import { getDb } from '../../../services';
import { COLLECTION_CREATORS, CreatorDocument } from '../model';
import { emitter } from '../../events';
// import { creatorTruLevelCalc } from '../controller/truLevel';

const logger = debug('features:creators:watcher');

interface StatusProps {
    data: CreatorDocument[];
}

export const status: StatusProps = {
    data: [],
};

uniqueExecution({
    name: __filename,
    callback: () => {
        retry(
            async () => {
                logger('Watching changes in creators');

                const creators = (await getDb()
                    .collection<CreatorDocument>(COLLECTION_CREATORS)
                    .find({})
                    .toArray()) as CreatorDocument[];
                status.data = creators;

                emitter.on(emitter.INITIAL_CREATORS, () => {
                    emitter.emit(emitter.LIST_CREATORS, status.data);
                });

                const changeStream = getDb()
                    .collection<CreatorDocument>(COLLECTION_CREATORS)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE CREATOR
                    if (change.operationType === 'update') {
                        if (!change.fullDocument) return;

                        const index = status.data.findIndex(
                            (item) =>
                                item._id.toString() ===
                                change.documentKey._id.toString()
                        );

                        if (index !== -1) {
                            status.data[index] = change.fullDocument;
                        } else {
                            status.data.push(change.fullDocument);
                        }

                        // creatorTruLevelCalc({
                        //     creatorDoc: change.fullDocument,
                        // });

                        emitter.emitUpdateCreator(change.fullDocument);
                    }

                    // OPERATION TYPE: INSERT CREATOR
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        status.data.push(change.fullDocument);
                        emitter.emitCreateCreator(change.fullDocument);
                    }

                    // OPERATION TYPE: DELETE CREATOR
                    if (change.operationType === 'delete') {
                        status.data = status.data.filter(
                            (item) =>
                                item._id.toString() !==
                                change.documentKey._id.toString()
                        );

                        emitter.emitDeleteCreator(
                            change.documentKey._id.toString()
                        );
                    }
                });
            },
            5,
            1000,
            'connect to database for watching changes: creators'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'creators' } });
            logger('Error watching changes in creators: %O', error);
            exitWithDelay({});
        });
    },
});
