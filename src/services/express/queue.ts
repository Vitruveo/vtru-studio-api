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
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_EXPRESS);
            status.channel.assertExchange(RABBITMQ_EXCHANGE_EXPRESS, 'topic', {
                durable: true,
            });
        }
        logger('Sending to express exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_EXPRESS,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_EXPRESS,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_EXPRESS,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_EXPRESS,
            },
            tags: { scope: 'sendToExchange' },
        });
    }
};
