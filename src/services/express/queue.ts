import debug from 'debug';
import { getChannel, Channel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_EXPRESS } from '../../constants';

const logger = debug('services:express:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchange = async (message: string, routingKey = 'log') => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            status.channel?.assertExchange(RABBITMQ_EXCHANGE_EXPRESS, 'topic', {
                durable: true,
            });
            status.channel?.on('close', () => {
                status.channel = null;
            });
        }
        if (status.channel) {
            status.channel.publish(
                RABBITMQ_EXCHANGE_EXPRESS,
                routingKey,
                Buffer.from(message)
            );
        }
    } catch (error) {
        logger('Error sending to queue: %O', error);
        captureException(error, { tags: { scope: 'sendToQueue' } });
    }
};
