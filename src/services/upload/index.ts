import debug from 'debug';

import { getChannel, Channel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES } from '../../constants';

const logger = debug('features:creators:upload:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeTemplate = async (
    message: string,
    routingKey: string
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger(
                'Asserting exchange: %s',
                RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES
            );
            status.channel.assertExchange(
                RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES,
                'topic',
                {
                    durable: true,
                }
            );
        }
        logger('Sending to template exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES,
        });
        status.channel.publish(
            RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES,
            },
            tags: { scope: 'sendToExchangeTemplate' },
        });
    }
};
