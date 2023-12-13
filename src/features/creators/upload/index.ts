import debug from 'debug';
import { RABBITMQ_EXCHANGE_CREATORS } from '../../../constants';
import { getChannel, Channel } from '../../../services/rabbitmq';
import { captureException } from '../../../services/sentry';

const logger = debug('features:creators:upload:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeCreators = async (
    message: string,
    routingKey = 'assets'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            status.channel?.assertExchange(
                RABBITMQ_EXCHANGE_CREATORS,
                'topic',
                {
                    durable: true,
                }
            );
        }
        if (status.channel) {
            status.channel.publish(
                RABBITMQ_EXCHANGE_CREATORS,
                routingKey,
                Buffer.from(message)
            );
        }
    } catch (error) {
        logger('Error sending to queue: %O', error);
        captureException(error, { tags: { scope: 'sendToQueue' } });
    }
};
