import { Channel } from 'amqplib';
import debug from 'debug';
import { getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_AUTO_CONSIGN } from '../../constants';

const logger = debug('services:autoConsign:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeAutoConsign = async (
    message: string,
    routingKey = 'create'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_AUTO_CONSIGN);
            status.channel.assertExchange(
                RABBITMQ_EXCHANGE_AUTO_CONSIGN,
                'topic',
                {
                    durable: true,
                }
            );
        }
        logger('Sending to auto consign exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_AUTO_CONSIGN,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_AUTO_CONSIGN,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_AUTO_CONSIGN,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_AUTO_CONSIGN,
            },
            tags: { scope: 'sendToExchangeAutoConsign' },
        });
    }
};
