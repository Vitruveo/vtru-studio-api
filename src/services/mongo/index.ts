import debug from 'debug';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { MONGO_DATABASE, MONGO_URL } from '../../constants';
import { captureException } from '../sentry';

const logger = debug('services:mongo');
const client = new MongoClient(MONGO_URL);

const status: {
    db: Db | null;
} = {
    db: null,
};

client.on('connect', () => {
    logger('MongoDB connected');
    status.db = client.db(MONGO_DATABASE);
});

client.on('disconnect', async () => {
    logger('MongoDB disconnected, reconnecting...');
    await client.connect();
});

client.on('error', (err) => {
    logger('MongoDB connection error: %O', err);
    captureException(err);

    // wait for capture sending the exception to sentry and exit
    setTimeout(() => {
        process.exit(1);
    }, 10_000);
});

const getDb = () => {
    if (!status.db) {
        throw new Error('MongoDB not connected');
    }
    return status.db;
};

export { client, getDb, ObjectId };
