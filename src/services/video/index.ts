import debug from 'debug';

import { Channel, getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_VIDEO } from '../../constants';

const logger = debug('services:video:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeVideo = async (
    message: string,
    routingKey = 'toSend'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_VIDEO);
            status.channel.assertExchange(RABBITMQ_EXCHANGE_VIDEO, 'topic', {
                durable: true,
            });
        }
        logger('Sending to video exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_VIDEO,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_VIDEO,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_VIDEO,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_VIDEO,
            },
            tags: { scope: 'sendToExchangeVideo' },
        });
    }
};
