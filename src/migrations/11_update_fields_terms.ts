/* eslint-disable no-await-in-loop */
import { ObjectId } from 'mongodb';
import { MigrationParameters } from '@nsfilho/migration';
import { COLLECTION_ASSETS } from '../features/assets/model/schema';

export const up = async ({ db }: MigrationParameters): Promise<void> => {
    const assets = await db.collection(COLLECTION_ASSETS).find({}).toArray();

    for (let index = 0; index < assets.length; index += 1) {
        const element = assets[index];

        await db.collection(COLLECTION_ASSETS).updateOne(
            { _id: new ObjectId(element._id) },
            {
                $set: {
                    'terms.isOriginal': element?.isOriginal || false,
                    'terms.generatedArtworkAI':
                        element?.generatedArtworkAI || false,
                    'terms.notMintedOtherBlockchain':
                        element?.notMintedOtherBlockchain || false,
                    'terms.contract': element?.contract || false,
                },
                $unset: {
                    isOriginal: '',
                    generatedArtworkAI: '',
                    notMintedOtherBlockchain: '',
                    contract: '',
                },
            }
        );
    }
};
