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

const defaultLimit = 50;

const fetchArtists = async (
    query: any,
    limit: number,
    payload: any[] = []
): Promise<any[]> => {
    const artistSpotlight = await findArtistsForSpotlight({ query, limit });
    logger('Artist found for spotlight: %d', artistSpotlight.length);

    if (artistSpotlight.length === 0) {
        logger('No artist found for spotlight, start cleaning');
        await clearArtistMark();
        if (payload.length > 0) {
            await markArtistWithFlag({
                ids: payload.map((artist) => new ObjectId(artist._id)),
            });
        }
        return fetchArtists(query, limit, payload);
    }

    await markArtistWithFlag({
        ids: artistSpotlight.map((artist) => new ObjectId(artist._id)),
    });

    const artistsWithConsign = await filterArtistsWithConsign({
        ids: artistSpotlight.map((artist) => new ObjectId(artist._id)),
    });
    logger('Artist with consign: %d', artistsWithConsign.length);

    payload.push(...artistsWithConsign);
    logger('Total payload found: %d', payload.length);

    if (payload.length < defaultLimit) {
        const newLimit = defaultLimit - payload.length;
        await fetchArtists(query, newLimit, payload);
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
        const limit = defaultLimit;
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
