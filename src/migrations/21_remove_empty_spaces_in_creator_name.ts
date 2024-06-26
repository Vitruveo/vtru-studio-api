/* eslint-disable no-await-in-loop */

import { MigrationParameters } from '@nsfilho/migration';
import { ObjectId } from 'mongodb';
import { COLLECTION_ASSETS } from '../features/assets/model';
import { COLLECTION_CREATORS } from '../features/creators/model';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const assets = await db.collection(COLLECTION_ASSETS).find({}).toArray();
    const creators = await db
        .collection(COLLECTION_CREATORS)
        .find({})
        .toArray();

    for (let i = 0; i < assets.length; i += 1) {
        const asset = assets[i];
        if (
            asset.assetMetadata?.creators?.formData &&
            Array.isArray(asset.assetMetadata?.creators?.formData)
        ) {
            for (
                let j = 0;
                j < asset.assetMetadata.creators.formData.length;
                j += 1
            ) {
                await db.collection(COLLECTION_ASSETS).updateOne(
                    {
                        _id: new ObjectId(asset._id),
                        'assetMetadata.creators.formData.name':
                            asset.assetMetadata.creators.formData[j].name,
                    },
                    {
                        $set: {
                            'assetMetadata.creators.formData.$.name':
                                asset.assetMetadata.creators.formData[
                                    j
                                ].name.trim(),
                        },
                    }
                );
            }
        }
    }

    for (let i = 0; i < creators.length; i += 1) {
        const creator = creators[i];
        if (creator.username) {
            await db.collection(COLLECTION_CREATORS).updateOne(
                { _id: creator._id },
                {
                    $set: {
                        username: creator.username.trim(),
                    },
                }
            );
        }
    }
};
