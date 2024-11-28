import debug from 'debug';

import { Channel, getChannel } from '../../../services/rabbitmq';
import { captureException } from '../../../services/sentry';
import { RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS } from '../../../constants';

const logger = debug('features:schedules:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeUpdateUsernameInAssets = async (
    message: string,
    routingKey = 'create'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger(
                'Asserting exchange: %s',
                RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS
            );
            status.channel.assertExchange(
                RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
                'topic',
                {
                    durable: true,
                }
            );
        }
        logger('Sending to update username in assets exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_UPDATE_USERNAME_IN_ASSETS,
            },
            tags: { scope: 'sendToExchangeUpdateUsernameInAssets' },
        });
    }
};
