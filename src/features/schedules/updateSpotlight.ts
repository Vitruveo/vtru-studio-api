import debug from 'debug';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import { uniqueExecution } from '@nsfilho/unique';
import { findAssetsForSpotlight } from '../assets/model';
import { exitWithDelay, retry } from '../../utils';
import { DIST } from '../../constants';

const logger = debug('features:schedules:updateSpotlight');

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
        await writeFile(join(DIST, 'spotlight.json'), JSON.stringify(assets));

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
                const existsLocalFile = await access(DIST)
                    .then(() => true)
                    .catch(() => false);
                if (!existsLocalFile) {
                    await writeFile(DIST, JSON.stringify([]));
                }
                await updateSpotlight();
            },
            5,
            1000,
            'updateSpotlight schedule'
        ).catch((error) => {
            logger('Error updateSpotlight', error);
            exitWithDelay({});
        }),
});
