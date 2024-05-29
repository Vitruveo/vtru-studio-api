/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model/schema';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const assets = await db
        .collection(COLLECTION_ASSETS)
        .find({
            'mintExplorer.transactionHash': {
                $exists: true,
            },
        })
        .toArray();

    for (let index = 0; index < assets.length; index += 1) {
        const element = assets[index];

        element.licenses.nft.availableLicenses = 0;

        await db
            .collection(COLLECTION_ASSETS)
            .replaceOne({ _id: element._id }, element);
    }
};
