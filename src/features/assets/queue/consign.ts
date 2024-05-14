import debug from 'debug';
import { Channel, captureException, getChannel } from '../../../services';
import { RABBITMQ_EXCHANGE_CONSIGN } from '../../../constants';

const logger = debug('features:assets:queue:consign');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeConsign = async (
    message: string,
    routingKey = 'start'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_CONSIGN);
            status.channel.assertExchange(RABBITMQ_EXCHANGE_CONSIGN, 'topic', {
                durable: true,
            });
        }
        logger('Sending to consign exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_CONSIGN,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_CONSIGN,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to consign exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_CONSIGN,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_CONSIGN,
            },
            tags: { scope: 'sendToExchangeConsign' },
        });
    }
};
