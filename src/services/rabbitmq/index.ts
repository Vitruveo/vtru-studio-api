import debug from 'debug';
import { uniqueExecution } from '@nsfilho/unique';
import rabbitmq, { Connection, Channel } from 'amqplib';
import { captureException } from '../sentry';
import {
    RABBITMQ_ERROR_TIMEOUT_BEFORE_EXIT,
    RABBITMQ_URL,
} from '../../constants';

const logger = {
    info: debug('services:rabbitmq:info'),
    error: debug('services:rabbitmq:error'),
};

const status: {
    connection: Connection | null;
} = {
    connection: null,
};

const exitAfterError = () => {
    setTimeout(() => {
        process.exit(1);
    }, RABBITMQ_ERROR_TIMEOUT_BEFORE_EXIT);
};

const getConnection = async () => {
    try {
        status.connection = await rabbitmq.connect(RABBITMQ_URL);
        logger.info(`connected: ${RABBITMQ_URL}`);

        status.connection.on('close', async () => {
            logger.error('connection closed, retrying...');
            status.connection = null;
            try {
                status.connection = await rabbitmq.connect(RABBITMQ_URL);
            } catch (error) {
                logger.error('failed on retry: %O', error);
                captureException(error, { tags: { scope: 'rabbitmq' } });
                exitAfterError();
            }
        });

        status.connection.on('error', (error) => {
            logger.error('Error occurred: %O', error);
            captureException(error, { tags: { scope: 'rabbitmq' } });
            exitAfterError();
        });
    } catch (err) {
        logger.error('Error connecting: %O', err);
        captureException(err, { tags: { scope: 'rabbitmq' } });
        exitAfterError();
    }
};

export const getChannel = async () => {
    try {
        if (!status.connection) await getConnection();
        if (!status.connection) throw Error('Connection not established');

        const myChannel = await status.connection.createChannel();

        // Handle interrupt signals
        const interruptSignals = ['SIGINT'];
        const handleInterrupt = async () => {
            if (myChannel) {
                await myChannel.close();
            }
        };
        interruptSignals.forEach((signal) =>
            process.once(signal, handleInterrupt)
        );

        // Handle channel close
        myChannel.on('close', () => {
            const stack = new Error();
            logger.error('Channel closed: %O', stack.stack);
        });

        myChannel.on('error', (error) => {
            logger.error('Error in channel:', error);
            captureException(error, { tags: { scope: 'rabbitmq' } });
            exitAfterError();
        });

        // Handle channel error

        return myChannel;
    } catch (error) {
        logger.error('Error creating a channel: %O', error);
        captureException(error, { tags: { scope: 'rabbitmq' } });
        throw Error;
    }
};

export const disconnect = async () => {
    if (status.connection) {
        const oldConnection = status.connection;
        status.connection = null;
        try {
            await oldConnection.close();
        } catch (error) {
            // do nothing
        }
    }
    logger.info('RabbitMQ connection not closed');
};

uniqueExecution({
    name: __filename,
    callback: () => getConnection(),
    advanced: {
        delay: 0,
        blockExecution: true,
        priority: 20,
    },
});

export { Channel };
