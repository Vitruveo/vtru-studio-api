import debug from 'debug';
import { getChannel, Channel } from '../rabbitmq';
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
            status.channel?.assertExchange(RABBITMQ_EXCHANGE_MAIL, 'topic', {
                durable: true,
            });
            status.channel?.on('close', () => {
                status.channel = null;
                process.exit(1);
            });
        }
        if (status.channel) {
            status.channel.publish(
                RABBITMQ_EXCHANGE_MAIL,
                routingKey,
                Buffer.from(message)
            );
        }
    } catch (error) {
        logger('Error sending to queue: %O', error);
        captureException(error, { tags: { scope: 'sendToQueue' } });
    }
};
