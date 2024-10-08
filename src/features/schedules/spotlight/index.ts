import debug from 'debug';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import { uniqueExecution } from '@nsfilho/unique';

import {
    findAssetsForSpotlight,
    updateManyAssetSpotlight,
    updateManyAssetSpotlightClear,
} from '../../assets/model';
import { exitWithDelay, retry } from '../../../utils';
import { DIST } from '../../../constants';
import { start } from './queue';

const logger = debug('features:schedules:updateSpotlight');
const spotlightPath = join(DIST, 'spotlight.json');

export const updateSpotlight = async () => {
    try {
        logger('starting schedule updateSpotlight');

        const query: any = {
            $and: [
                {
                    'framework.createdBy': {
                        $exists: true,
                    },
                },
                {
                    'framework.createdBy': {
                        $ne: null,
                        $nin: [''],
                    },
                },
            ],
            'consignArtwork.status': 'active',
            mintExplorer: { $exists: false },
            contractExplorer: { $exists: true },
            'actions.displaySpotlight': {
                $exists: false,
            },
        };
        const limit = 50;
        const assets = await findAssetsForSpotlight({ query, limit });
        const payload = assets.sort(() => Math.random() - 0.5);

        await writeFile(spotlightPath, JSON.stringify(payload));

        // adicionar a flag de displaySpotlight nos novos assets
        await updateManyAssetSpotlight({
            ids: assets.map((asset) => asset._id),
        });

        logger('Spotlight data updated successfully');
    } catch (error) {
        logger('Error schedule updateSpotlight', error);
    }
};

export const clearSpotlight = async () => {
    try {
        logger('starting schedule clearSpotlight');

        // remover a flag de displaySpotlight dos assets
        await updateManyAssetSpotlightClear();

        logger('Spotlight data cleared successfully');
    } catch (error) {
        logger('Error schedule clearSpotlight', error);
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
