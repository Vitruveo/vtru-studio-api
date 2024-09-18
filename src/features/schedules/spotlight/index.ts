import debug from 'debug';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import { uniqueExecution } from '@nsfilho/unique';

import { findAssetsForSpotlight } from '../../assets/model';
import { exitWithDelay, retry } from '../../../utils';
import { DIST } from '../../../constants';
import { start } from './queue';

const logger = debug('features:schedules:updateSpotlight');
const spotlightPath = join(DIST, 'spotlight.json');

export const updateSpotlight = async () => {
    try {
        logger('starting schedule updateSpotlight');

        const query: any = {
            'assetMetadata.taxonomy.formData.nudity': 'no',
            'consignArtwork.status': 'active',
            mintExplorer: { $exists: false },
            contractExplorer: { $exists: true },
        };
        const limit = 50;
        const assets = await findAssetsForSpotlight({ query, limit });
        await writeFile(spotlightPath, JSON.stringify(assets));

        logger('Spotlight data updated successfully');
    } catch (error) {
        logger('Error schedule updateSpotlight', error);
    }
};

uniqueExecution({
    name: 'updateSpotlight',
    callback: () =>
        retry(
            async () => {
                const existsLocalFile = await access(spotlightPath)
                    .then(() => true)
                    .catch(() => false);
                if (!existsLocalFile) {
                    await writeFile(spotlightPath, JSON.stringify([]));
                }
                await updateSpotlight();
                await start();
            },
            5,
            1000,
            'updateSpotlight schedule'
        ).catch((error) => {
            logger('Error updateSpotlight', error);
            exitWithDelay({});
        }),
});
