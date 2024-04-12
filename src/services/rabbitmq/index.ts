import debug from 'debug';
import rabbitmq, { Connection, Channel } from 'amqplib';
import { captureException } from '../sentry';
import { RABBITMQ_URL } from '../../constants';

const logger = debug('services:rabbitmq');

const status: {
    connection: Connection | null;
} = {
    connection: null,
};

export const getConnection = async () => {
    try {
        console.log('RABBITMQ_URL', RABBITMQ_URL);
        if (!status.connection) {
            status.connection = await rabbitmq.connect(RABBITMQ_URL);
            status.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
                // status.connection = null;
                process.exit(1);
            });
            status.connection.on('error', (error) => {
                console.error('Error occurred in RabbitMQ connection:', error);
            });
        }
    } catch (err) {
        logger('Error connecting to rabbitmq: %O', err);
        captureException(err, { tags: { scope: 'rabbitmq' } });
        process.exit(1);
        // status.connection = null;
    }
    return status.connection;
};

export const disconnect = async () => {
    if (status.connection) {
        const oldConnection = status.connection;
        status.connection = null;

        try {
            await oldConnection.close();
        } catch (error) {
            // ignore
        }
    }
};

export const getChannel = async () => {
    try {
        const connection = await getConnection();
        if (connection) {
            return connection.createChannel();
        }

        // if connection is null
        process.exit(1);
    } catch (error) {
        logger('Error creating channel: %O', error);
        captureException(error, { tags: { scope: 'rabbitmq' } });
    }
    return null;
};

export { Channel };
