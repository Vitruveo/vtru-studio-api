import debug from 'debug';

import { Channel, disconnect, getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_MAIL } from '../../constants';

const logger = debug('services:mail:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeMail = async (
    message: string,
    routingKey = 'toSend'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();

            process.once('SIGINT', async () => {
                if (status.channel) {
                    await status.channel.close();
                }

                await disconnect();
            });

            if (!status.channel) {
                logger('Channel not available');
                process.exit(1);
            }

            status.channel.on('close', () => {
                logger('Channel closed');
                process.exit(1);
            });
            status.channel.on('error', (error) => {
                logger('Error occurred in channel:', error);
                process.exit(1);
            });

            logger('Channel services mail started');

            status.channel.assertExchange(RABBITMQ_EXCHANGE_MAIL, 'topic', {
                durable: true,
            });
        }
        if (status.channel) {
            status.channel.publish(
                RABBITMQ_EXCHANGE_MAIL,
                routingKey,
                Buffer.from(message)
            );
        }
    } catch (error) {
        logger('Error sending to queue: %O', error);
        captureException(error, { tags: { scope: 'sendToQueue' } });
    }
};
