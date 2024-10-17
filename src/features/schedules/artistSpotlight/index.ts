import debug from 'debug';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import { uniqueExecution } from '@nsfilho/unique';
import { DIST } from '../../../constants';
import { exitWithDelay, retry } from '../../../utils';
import {
    findArtistsForSpotlight,
    updateManyArtistSpotlight,
    updateManyArtistsSpotlightClear,
} from '../../assets/model';
import { sendMessageDiscord } from '../../../services/discord';

const logger = debug('features:schedules:artistSpotlight');
const artistSpotlightPath = join(DIST, 'artistSpotlight.json');

const clearArtistSpotlight = async () => {
    try {
        logger('starting schedule clearArtistSpotlight');
        sendMessageDiscord({ message: 'start schedule clearArtistSpotlight' });
        // remover a flag de displaySpotlight dos creators
        await updateManyArtistsSpotlightClear();

        logger('Spotlight data cleared successfully');
    } catch (error) {
        logger('Error schedule clearArtistSpotlight', error);
    }
};

export const updateArtistSpotlight = async () => {
    try {
        logger('starting schedule updateArtistSpotlight');
        sendMessageDiscord({ message: 'start schedule updateArtistSpotlight' });

        const limit = 50;
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
            'actions.displayArtistSpotlight': {
                $exists: false,
            },
        };
        const artistSpotlight = await findArtistsForSpotlight({ query, limit });
        let payload = artistSpotlight;

        if (payload.length === 0) {
            logger('All artists are already in the spotlight');
            sendMessageDiscord({
                message: 'All artists are already in the spotlight',
            });
            await clearArtistSpotlight();
            await updateArtistSpotlight();
            return;
        }
        if (payload.length < limit) {
            logger('Less than %d artists found, clearing spotlight', limit);
            sendMessageDiscord({
                message: `Less than ${limit} artists found, clearing spotlight`,
            });
            await clearArtistSpotlight();
            const missingArtists = await findArtistsForSpotlight({
                query,
                limit: limit - payload.length,
            });
            payload = payload.concat(missingArtists);
        }

        await writeFile(
            artistSpotlightPath,
            JSON.stringify(payload.sort(() => 0.5 - Math.random()))
        );

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
