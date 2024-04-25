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
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_MAIL);
            status.channel.assertExchange(RABBITMQ_EXCHANGE_MAIL, 'topic', {
                durable: true,
            });
        }
        logger('Sending to mail exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_MAIL,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_MAIL,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_MAIL,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_MAIL,
            },
            tags: { scope: 'sendToExchangeCreators' },
        });
    }
};
