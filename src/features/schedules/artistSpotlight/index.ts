import debug from 'debug';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import { uniqueExecution } from '@nsfilho/unique';
import { DIST } from '../../../constants';
import {
    findArtistsForSpotlight,
    updateManyArtistSpotlight,
    updateManyArtistsSpotlightClear,
} from '../../creators/model';
import { exitWithDelay, retry } from '../../../utils';

const logger = debug('features:schedules:artistSpotlight');
const artistSpotlightPath = join(DIST, 'artistSpotlight.json');

export const updateArtistSpotlight = async () => {
    try {
        logger('starting schedule updateArtistSpotlight');

        const limit = 50;
        const query: any = {
            'profile.avatar': { $exists: true, $ne: null },
            username: { $exists: true, $ne: null },
        };
        const artistSpotlight = await findArtistsForSpotlight({ query, limit });
        await writeFile(artistSpotlightPath, JSON.stringify(artistSpotlight));

        // remover a flag de displaySpotlight dos creators
        await updateManyArtistsSpotlightClear();

        // adicionar a flag de displaySpotlight nos novos creators
        await updateManyArtistSpotlight({
            ids: artistSpotlight.map((artist) => artist._id),
        });

        logger('Spotlight data updated successfully');
    } catch (error) {
        logger('Error schedule updateSpotlight', error);
    }
};

uniqueExecution({
    name: 'updateArtistSpotlight',
    callback: () =>
        retry(
            async () => {
                const existsLocalFile = await access(artistSpotlightPath)
                    .then(() => true)
                    .catch(() => false);
                if (!existsLocalFile) {
                    await writeFile(artistSpotlightPath, JSON.stringify([]));
                }
                await updateArtistSpotlight();
            },
            5,
            1000,
            'updateArtistSpotlight schedule'
        ).catch((error) => {
            logger('Error updateArtistSpotlight', error);
            exitWithDelay({});
        }),
});
