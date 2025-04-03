import debug from 'debug';

import { Channel, getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_PRINT_OUTPUTS } from '../../constants';

const logger = debug('services:printOutputs:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangePrintOutputs = async (
    message: string,
    routingKey = 'toSend'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_PRINT_OUTPUTS);
            status.channel.assertExchange(
                RABBITMQ_EXCHANGE_PRINT_OUTPUTS,
                'topic',
                {
                    durable: true,
                }
            );
        }
        status.channel.publish(
            RABBITMQ_EXCHANGE_PRINT_OUTPUTS,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_PRINT_OUTPUTS,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_PRINT_OUTPUTS,
            },
            tags: { scope: 'sendToExchangegrid' },
        });
    }
};
