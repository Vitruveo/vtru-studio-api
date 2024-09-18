import debug from 'debug';
import { nanoid } from 'nanoid';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { disconnect, getChannel } from '../../../services';
import { DIST, RABBITMQ_EXCHANGE_SPOTLIGHT } from '../../../constants';

const logger = debug('features:schedules:spotlight:queue');
const spotlightPath = join(DIST, 'spotlight.json');

const uniqueId = nanoid();

export const start = async () => {
    const channel = await getChannel();

    if (!channel) {
        logger('Channel not available');
        process.exit(1);
    }
    channel.on('close', () => {
        logger('Channel closed');
        process.exit(1);
    });
    channel.on('error', (error) => {
        logger('Error occurred in channel:', error);
        process.exit(1);
    });

    logger('Channel spotlight started');

    const logQueue = `${RABBITMQ_EXCHANGE_SPOTLIGHT}.toSend.${uniqueId}`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_SPOTLIGHT, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_SPOTLIGHT, 'toSend');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            const payload = JSON.parse(data.content.toString());
            const spotlightRaw = await readFile(spotlightPath, 'utf-8');

            const spotlight = JSON.parse(spotlightRaw);

            const filteredSpotlight = spotlight.filter(
                (asset: any) => asset._id !== payload._id
            );

            await writeFile(spotlightPath, JSON.stringify(filteredSpotlight));
        } catch (error) {
            logger('Error processing message', error);

            channel.nack(data);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);

        // disconnect from RabbitMQ
        await disconnect();
    });
};
