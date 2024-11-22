/* eslint-disable no-underscore-dangle */
import debug from 'debug';

import { sentry } from '../../../services/sentry';
import { getChannel, disconnect } from '../../../services/rabbitmq';
import { RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS } from '../../../constants';
import { model } from '..';
import { model as modelAssets } from '../../assets';

const logger = debug('features:schedules:queue:autoConsign');

export const startQueueUpdateUsernameInAssets = async () => {
    logger('Starting queue UpdateUsernameInAssets');
    const channel = await getChannel();

    if (!channel) {
        logger('Channel not available');
        process.exit(1);
    }
    channel.on('close', () => {
        logger('Channel closed');
        process.exit(1);
    });
    channel.on('error', (error) => {
        logger('Error occurred in channel:', error);
        process.exit(1);
    });

    logger('Channel queue UpdateUsernameInAssets started');

    const logQueue = `${RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS}.create`;
    logger('logQueue', logQueue);
    channel.assertExchange(
        RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
        'topic',
        {
            durable: true,
        }
    );
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(
        logQueue,
        RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
        'create'
    );

    // prefetch 1 message at a time
    await channel.prefetch(1);

    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            logger('Received message');

            // parse envelope
            const parsedMessage = JSON.parse(data.content.toString().trim());
            const { creatorId } = parsedMessage;

            const creator = await model.findCreatorById({ id: creatorId });

            if (!creator) {
                logger('Creator not found');
                channel.ack(data);
                return;
            }

            const assets = await modelAssets.findMyAssets({
                query: { 'framework.createdBy': creatorId },
            });

            if (assets.length === 0) {
                logger('Assets not found');
                channel.ack(data);
                return;
            }

            await modelAssets.updateAssetsUsername({
                data: assets,
                username: creator.username || '',
            });

            channel.ack(data);
        } catch (parsingError) {
            sentry.captureException(parsingError);
            channel.nack(data);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);

        // disconnect from RabbitMQ
        await disconnect();
    });
};
