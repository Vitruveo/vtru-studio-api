import debug from 'debug';
import {
    MongoClient,
    Db,
    ObjectId,
    InsertOneResult,
    InsertManyResult,
    UpdateResult,
    DeleteResult,
} from 'mongodb';
import { MONGO_DATABASE, MONGO_URL } from '../../constants';
import { captureException } from '../sentry';

const logger = debug('services:mongo');
const client = new MongoClient(MONGO_URL);

const status: {
    db: Db | null;
} = {
    db: null,
};

const connect = async () => {
    try {
        logger(`Connecting to MongoDB: ${MONGO_URL}`);
        await client.connect();
        status.db = client.db(MONGO_DATABASE);
    } catch (error) {
        logger('MongoDB connection error: %O', error);
        captureException(error);

        // wait for capture sending the exception to sentry and exit
        setTimeout(() => {
            process.exit(1);
        }, 10_000);
    }
};

connect();

const getDb = () => {
    if (!status.db) {
        throw new Error('MongoDB not connected');
    }
    return status.db;
};

export {
    client,
    getDb,
    ObjectId,
    InsertOneResult,
    InsertManyResult,
    UpdateResult,
    DeleteResult,
};
