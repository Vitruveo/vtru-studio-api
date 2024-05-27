/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model/schema';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const assets = await db
        .collection(COLLECTION_ASSETS)
        .find({ 'assetMetadata.taxonomy.formData.tags': { $regex: ',' } })
        .toArray();

    for (let index = 0; index < assets.length; index += 1) {
        const element = assets[index];

        const tags: string[] = [];

        if (Array.isArray(element?.assetMetadata?.taxonomy?.formData?.tags)) {
            element.assetMetadata.taxonomy.formData.tags.forEach(
                (tag: string) => {
                    if (tag.includes(',')) {
                        const items = tag
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean);

                        tags.push(...items);
                    } else {
                        tags.push(tag);
                    }
                }
            );
        }

        element.assetMetadata.taxonomy.formData.tags = tags;

        await db
            .collection(COLLECTION_ASSETS)
            .replaceOne({ _id: element._id }, element);
    }
};
