import debug from 'debug';
import { join } from 'path';
import { uniqueExecution } from '@nsfilho/unique';
import { access, writeFile } from 'fs/promises';
import { DIST } from '../../../constants';
import { sendMessageDiscord } from '../../../services/discord';
import { exitWithDelay, retry } from '../../../utils';
import { findStacksSpotlight } from '../../creators/model';

const logger = debug('features:schedules:artistSpotlight');
const stackSpotlightPath = join(DIST, 'stackSpotlight.json');

export const updateStackSpotlight = async () => {
    try {
        logger('starting schedule updateStackSpotlight');
        sendMessageDiscord({ message: 'start schedule updateStackSpotlight' });

        const limit = 50;
        const query: any = {};
        const stackSpotlight = await findStacksSpotlight({ query, limit });
        let payload = stackSpotlight;

        if (payload.length === 0) {
            logger('All stacks are already in the spotlight');
            sendMessageDiscord({
                message: 'All stacks are already in the spotlight',
            });
            await updateStackSpotlight();
            return;
        }
        if (payload.length < limit) {
            logger('Less than %0 stacks found, clearing spotlight', limit);
            sendMessageDiscord({
                message: `Less than ${limit} stacks foundm clearing spotlight`,
            });
            const missingStacks = await findStacksSpotlight({
                query,
                limit: limit - payload.length,
            });
            payload = payload.concat(missingStacks);
        }

        await writeFile(
            stackSpotlightPath,
            JSON.stringify(payload.sort(() => 0.5 - Math.random()))
        );

        logger('Stacks Spotlight data updated successfully');
    } catch (error) {
        logger('Error schedule updateStackSpotlight', error);
    }
};

uniqueExecution({
    name: 'updateStackSpotlight',
    callback: () =>
        retry(
            async () => {
                const existLocalFile = await access(stackSpotlightPath)
                    .then(() => true)
                    .catch(() => false);
                if (!existLocalFile) {
                    await writeFile(stackSpotlightPath, JSON.stringify([]));
                }
                await updateStackSpotlight();
            },
            5,
            1000,
            'updateStackSpotlight schedule'
        ).catch((error) => {
            logger('Error updateStackSpotlight', error);
            exitWithDelay({});
        }),
});
