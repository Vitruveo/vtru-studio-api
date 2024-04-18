import debug from 'debug';

import { getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_MAIL } from '../../constants';

const logger = debug('services:mail:queue');

export const sendToExchangeMail = async (
    message: string,
    routingKey = 'toSend'
) => {
    try {
        const channel = await getChannel();
        if (!channel) process.exit(1);

        channel.on('close', () => {
            logger('Channel closed');
            process.exit(1);
        });
        channel.on('error', (error) => {
            logger('Error occurred in channel:', error);
            process.exit(1);
        });

        channel.assertExchange(RABBITMQ_EXCHANGE_MAIL, 'topic', {
            durable: true,
        });
        channel.publish(
            RABBITMQ_EXCHANGE_MAIL,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to queue: %O', error);
        captureException(error, { tags: { scope: 'sendToQueue' } });
        process.exit(1);
    }
};
