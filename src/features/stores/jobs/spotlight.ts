import debug from 'debug';

import { redis } from '../../../services/redis';
import * as model from '../model/db';
import { StoresDocument } from '../model';

const logger = debug('features:stores:jobs:spotlight');

const LIMITED_SPOTLIGHT = 50;

export const spotlight = async () => {
    logger('Starting Stores spotlight job');

    const count = await model.countStoresToSpotlight();
    logger('Stores to spotlight: %d', count);

    if (count === 0) {
        logger('No stores to spotlight');
        await model.clearSpotlight();
    }

    // get stores to spotlight
    const stores = await model.findStoresToSpotlight();
    logger('Stores to spotlight found: %d', stores.length);

    // update displaySpotlight
    await model.updateDisplaySpotlight(
        stores.map((store) => store._id.toString())
    );
    logger('Stores updated to display spotlight: %d', stores.length);

    let missingStores: StoresDocument[] = [];

    if (stores.length < LIMITED_SPOTLIGHT) {
        logger('Less than %d stores to spotlight', LIMITED_SPOTLIGHT);
        await model.clearSpotlight();

        // get missing stores to spotlight
        missingStores = await model.findStoresMissingSpotlight({
            ids: stores.map((store) => store._id.toString()),
            limit: LIMITED_SPOTLIGHT - stores.length,
        });
        logger('Missing stores to spotlight: %d', missingStores.length);
    }

    // merge stores and missing stores to spotlight and shuffle
    const response = [...stores, ...missingStores].sort(
        () => Math.random() - 0.5
    );

    // clear redis
    await redis.del('stores:spotlight');

    // update redis
    await redis.set(
        'stores:spotlight',
        JSON.stringify(
            response.map((store) => ({
                _id: store._id.toString(),
                name: store.organization!.name,
                url: store.organization!.url || '',
                description: store.organization?.description || '',
                logo: store.organization?.formats.logo.square?.path,
            }))
        )
    );
    logger('Redis updated with stores to spotlight');

    logger('Spotlight job finished');
};
