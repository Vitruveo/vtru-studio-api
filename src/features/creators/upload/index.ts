import debug from 'debug';
import { RABBITMQ_EXCHANGE_CREATORS } from '../../../constants';
import { getChannel, Channel, disconnect } from '../../../services/rabbitmq';
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
        logger('Sending to exchange creators');

        if (!status.channel) {
            status.channel = await getChannel();

            process.once('SIGINT', async () => {
                if (status.channel) {
                    await status.channel.close();
                }

                await disconnect();
            });

            if (!status.channel) {
                logger('Channel not available');
                process.exit(1);
            }

            status.channel.on('close', () => {
                logger('Channel closed');
                process.exit(1);
            });
            status.channel.on('error', (error) => {
                logger('Error occurred in channel:', error);
                process.exit(1);
            });

            logger('Channel creators assets started');

            status.channel.assertExchange(RABBITMQ_EXCHANGE_CREATORS, 'topic', {
                durable: true,
            });
        }
        if (status.channel) {
            logger('Sending to queue: %s', message);
            logger('Routing key: %s', routingKey);
            logger('Exchange: %s', RABBITMQ_EXCHANGE_CREATORS);

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
