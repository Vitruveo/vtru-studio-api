import debug from 'debug';
import { join } from 'path';
import { writeFile, access } from 'fs/promises';
import { uniqueExecution } from '@nsfilho/unique';
import { ObjectId } from 'mongodb';
import { DIST } from '../../../constants';
import { exitWithDelay, retry } from '../../../utils';
import { sendMessageDiscord } from '../../../services/discord';
import {
    clearArtistMark,
    filterArtistsWithConsign,
    findArtistsForSpotlight,
    markArtistWithFlag,
} from '../../creators/model';

const logger = debug('features:schedules:artistSpotlight');
const artistSpotlightPath = join(DIST, 'artistSpotlight.json');

const fetchArtists = async (
    query: any,
    limit: number,
    payload: any[] = []
): Promise<any[]> => {
    const artistSpotlight = await findArtistsForSpotlight({ query, limit });

    await markArtistWithFlag({
        ids: artistSpotlight.map((artist) => new ObjectId(artist._id)),
    });

    const artistsWithConsign = await filterArtistsWithConsign({
        ids: artistSpotlight.map((artist) => new ObjectId(artist._id)),
    });

    payload.push(...artistsWithConsign);

    if (payload.length === 0) {
        logger('No artist found for ArtistSpotlight, start cleaning');
        sendMessageDiscord({
            message: 'No artist found for ArtistSpotlight, start cleaning',
        });
        await clearArtistMark();
        return fetchArtists(query, limit, payload);
    }

    if (payload.length < limit) {
        logger('less than %d for ArtistSpotlight, researching', limit);
        sendMessageDiscord({
            message: `less than ${limit} for ArtistSpotlight, researching`,
        });
        const remainingLimit = limit - payload.length;
        return fetchArtists(query, remainingLimit, payload);
    }

    return payload;
};

export const updateArtistSpotlight = async () => {
    try {
        logger('starting schedule updateArtistSpotlight');
        sendMessageDiscord({ message: 'start schedule updateArtistSpotlight' });

        const query: any = {
            'profile.avatar': { $ne: null, $nin: [''] },
            'actions.displaySpotlight': { $exists: false },
        };
        const limit = 50;
        const payload = await fetchArtists(query, limit);

        await writeFile(
            artistSpotlightPath,
            JSON.stringify(payload.sort(() => Math.random() - 0.5))
        );

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
