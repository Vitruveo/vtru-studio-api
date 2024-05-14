import debug from 'debug';
import { uniqueExecution } from '@nsfilho/unique';
import { COLLECTION_ASSETS, AssetsDocument } from '../model';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';
import { captureException, getDb, ObjectId } from '../../../services';
import { sendToExchangeRSS } from '../../../services/rss';
import { exitWithDelay, retry } from '../../../utils';
import { emitter } from '../emitter';

const logger = debug('features:assets:watcher');

uniqueExecution({
    name: __filename,
    callback: () =>
        retry(
            async () => {
                logger('Watching changes in assets');

                const changeStream = getDb()
                    .collection<AssetsDocument>(COLLECTION_ASSETS)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    if (change.operationType === 'delete') {
                        // dispatch queue to remove asset from rss
                        await sendToExchangeRSS(
                            JSON.stringify({
                                id: change.documentKey._id.toString(),
                            }),
                            'remove'
                        );
                    }

                    if (
                        change.operationType === 'replace' ||
                        change.operationType === 'update'
                    ) {
                        // check if c2pa is finished
                        if (change.fullDocument?.c2pa?.finishedAt) {
                            emitter.emitterC2paSuccess(
                                change.fullDocument.c2pa
                            );
                        }

                        // check if ipfs is finished
                        if (change.fullDocument?.ipfs?.finishedAt) {
                            emitter.emitterIpfsSuccess(
                                change.fullDocument.ipfs
                            );
                        }

                        // check if consign is finished
                        if (change.fullDocument?.contractExplorer?.finishedAt) {
                            emitter.emitterConsignSuccess(
                                change.fullDocument.contractExplorer
                            );
                        }

                        // check consign artwork status before is active and after is not active
                        if (
                            change.fullDocument?.consignArtwork?.status &&
                            change.fullDocument?.consignArtwork?.status !==
                                'active'
                        ) {
                            // dispatch queue to remove from rss
                            await sendToExchangeRSS(
                                JSON.stringify({
                                    id: change.documentKey._id.toString(),
                                }),
                                'remove'
                            );
                        }

                        // check consign artwork status before is not active and after is active
                        if (
                            change.fullDocument?.consignArtwork?.status &&
                            change.fullDocument?.consignArtwork?.status ===
                                'active'
                        ) {
                            const asset = change.fullDocument;
                            if (!asset.framework.createdBy) return;

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
                                Object.entries(asset?.licenses || {}).map(
                                    ([key, license]) => {
                                        if (license.added) {
                                            const payload = JSON.stringify({
                                                license: key,
                                                id: asset._id.toString(),
                                                title: asset.assetMetadata
                                                    .context.formData.title,
                                                url: `${STORE_URL}/${
                                                    creator.username
                                                }/${asset._id.toString()}/${Date.now()}`,
                                                creator:
                                                    asset.assetMetadata.creators
                                                        .formData[0].name,
                                                image: `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`,
                                                description:
                                                    asset?.mediaAuxiliary
                                                        ?.description ||
                                                    asset.assetMetadata.context
                                                        .formData.description,
                                            });
                                            // dispatch queue to add to rss
                                            return sendToExchangeRSS(
                                                payload,
                                                'consign'
                                            );
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
                    }
                });
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
