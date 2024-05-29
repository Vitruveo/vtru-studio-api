/* eslint-disable no-await-in-loop */
import { ObjectId } from 'mongodb';
import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model/schema';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const assets = await db.collection(COLLECTION_ASSETS).find({}).toArray();

    for (let index = 0; index < assets.length; index += 1) {
        const element = assets[index];

        if (
            Array.isArray(
                element?.assetMetadata?.taxonomy?.formData?.collections
            )
        ) {
            const collections =
                element.assetMetadata.taxonomy.formData.collections.filter(
                    (collection: string) => collection !== null
                );

            await db.collection(COLLECTION_ASSETS).updateOne(
                { _id: new ObjectId(element._id) },
                {
                    $set: {
                        'assetMetadata.taxonomy.formData.collections':
                            collections,
                    },
                }
            );
        }
    }
};
