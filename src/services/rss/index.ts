import debug from 'debug';

import { Channel, getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_RSS } from '../../constants';

const logger = debug('services:rss:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeRSS = async (
    message: string,
    routingKey = 'create'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_RSS);
            status.channel.assertExchange(RABBITMQ_EXCHANGE_RSS, 'topic', {
                durable: true,
            });
        }
        logger('Sending to rss exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_RSS,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_RSS,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_RSS,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_RSS,
            },
            tags: { scope: 'sendToExchangeRSS' },
        });
    }
};
