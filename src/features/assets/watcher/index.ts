import debug from 'debug';
import { uniqueExecution } from '@nsfilho/unique';
import { ChangeStreamDocument } from 'mongodb';
import { COLLECTION_ASSETS, AssetsDocument } from '../model';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';
import { captureException, getDb, ObjectId } from '../../../services';
import { sendToExchangeRSS } from '../../../services/rss';
import { exitWithDelay, retry } from '../../../utils';

const logger = debug('features:assets:watcher');

interface DispatchQueueParams {
    license: string;
    id: string;
    title: string;
    url: string;
    creator: string;
    image: string;
    description: string;
}

const dispatchQueue = async ({
    license,
    id,
    title,
    url,
    creator,
    image,
    description,
}: DispatchQueueParams) => {
    const payload = JSON.stringify({
        license,
        id,
        title,
        url,
        creator,
        image,
        description,
    });
    // dispatch queue to add to rss
    return sendToExchangeRSS(payload, 'consign');
};

uniqueExecution({
    name: __filename,
    callback: () =>
        retry(
            async () => {
                logger('Watching changes in assets');

                const changeStream = getDb()
                    .collection<AssetsDocument>(COLLECTION_ASSETS)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on(
                    'change',
                    async (change: ChangeStreamDocument) => {
                        if (change.operationType === 'delete') {
                            // dispatch queue to remove asset from rss
                            await sendToExchangeRSS(
                                JSON.stringify({
                                    id: change.documentKey._id.toString(),
                                }),
                                'remove'
                            );
                        }

                        if (change.operationType === 'update') {
                            const keys = Object.keys(
                                change.updateDescription.updatedFields || {}
                            );

                            // check if status is active and add to rss
                            if (
                                keys.includes('consignArtwork.status') &&
                                change?.updateDescription?.updatedFields?.[
                                    'consignArtwork.status'
                                ] === 'active'
                            ) {
                                const asset = change.fullDocument;
                                if (!asset?.framework.createdBy) return;

                                const creator = await getDb()
                                    .collection('creators')
                                    .findOne(
                                        {
                                            _id: new ObjectId(
                                                asset.framework.createdBy
                                            ),
                                        },
                                        { projection: { username: 1 } }
                                    );

                                if (!creator) return;

                                await Promise.all(
                                    Object.entries(asset.licenses).map(
                                        (item) => {
                                            const [key, license] = item as [
                                                string,
                                                AssetsDocument['licenses'][keyof AssetsDocument['licenses']],
                                            ];

                                            if (license.added) {
                                                return dispatchQueue({
                                                    license: key,
                                                    id: asset._id.toString(),
                                                    title: asset.assetMetadata
                                                        .context.formData.title,
                                                    url: `${STORE_URL}/${
                                                        creator.username
                                                    }/${asset._id.toString()}/${Date.now()}`,
                                                    creator: Array.isArray(
                                                        asset.assetMetadata
                                                            .creators.formData
                                                    )
                                                        ? asset.assetMetadata
                                                              .creators
                                                              .formData[0].name
                                                        : 'Unknown Creator',
                                                    image: `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`,
                                                    description:
                                                        asset?.mediaAuxiliary
                                                            ?.description ||
                                                        asset.assetMetadata
                                                            .context.formData
                                                            .description,
                                                });
                                            }
                                            return Promise.resolve();
                                        }
                                    )
                                ).catch((error) =>
                                    logger(
                                        'Error sending to exchange rss: %O',
                                        error
                                    )
                                );
                            }

                            // check if status is not active and remove from rss
                            if (
                                keys.includes('consignArtwork.status') &&
                                change?.updateDescription?.updatedFields?.[
                                    'consignArtwork.status'
                                ] !== 'active'
                            ) {
                                await sendToExchangeRSS(
                                    JSON.stringify({
                                        id: change.documentKey._id.toString(),
                                    }),
                                    'remove'
                                );
                            }
                        }
                    }
                );
            },
            5,
            1000,
            'connect to database for watching changes: assets'
        ).catch((error) => {
            captureException(error, { tags: { scope: 'profiles' } });
            logger('Error watching changes in profiles: %O', error);
            exitWithDelay({});
        }),
});
