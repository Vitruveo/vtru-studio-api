import debug from 'debug';
import { uniqueExecution } from '@nsfilho/unique';
import { COLLECTION_ASSETS, AssetsDocument } from '../model';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';
import { captureException, getDb, ObjectId } from '../../../services';
import { sendToExchangeRSS } from '../../../services/rss';
import { exitWithDelay, retry } from '../../../utils';
import { emitter } from '../../events';

const logger = debug('features:assets:watcher');

interface StatusProps {
    data: AssetsDocument[];
}

interface DispatchQueueParams {
    license: string;
    id: string;
    title: string;
    url: string;
    creator: string;
    image: string;
    description: string;
}

export const status: StatusProps = {
    data: [],
};

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

                const assets = await getDb()
                    .collection<AssetsDocument>(COLLECTION_ASSETS)
                    .find({})
                    .toArray();

                status.data = assets;
                emitter.on(emitter.INITIAL_ASSETS, () => {
                    emitter.emit(emitter.LIST_ASSETS, status.data);
                });

                const changeStream = getDb()
                    .collection<
                        AssetsDocument & { 'consignArtwork.status': string }
                    >(COLLECTION_ASSETS)
                    .watch([], { fullDocument: 'updateLookup' });

                changeStream.on('change', async (change) => {
                    // OPERATION TYPE: UPDATE ASSET
                    if (change.operationType === 'replace') {
                        if (!change.fullDocument) return;

                        const index = status.data.findIndex(
                            (item) => item._id === change.documentKey._id
                        );
                        if (index !== -1) {
                            status.data[index] = change.fullDocument;
                        } else {
                            status.data.push(change.fullDocument);
                        }

                        emitter.emitUpdateAsset(change.fullDocument);
                    }

                    // OPERATION TYPE: UPDATE ASSET
                    if (change.operationType === 'update') {
                        if (!change.fullDocument) return;

                        const index = status.data.findIndex(
                            (item) => item._id === change.documentKey._id
                        );
                        if (index !== -1) {
                            status.data[index] = change.fullDocument;
                        } else {
                            status.data.push(change.fullDocument);
                        }

                        emitter.emitUpdateAsset(change.fullDocument);

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
                                Object.entries(asset.licenses)
                                    .filter(([key]) => key !== 'artCards')
                                    .map((item) => {
                                        const [key, license] = item as [
                                            string,
                                            AssetsDocument['licenses'][keyof AssetsDocument['licenses']],
                                        ];

                                        if (!license?.added)
                                            return Promise.resolve();

                                        return dispatchQueue({
                                            license: key,
                                            id: asset._id.toString(),
                                            title: asset.assetMetadata.context
                                                .formData.title,
                                            url: `${STORE_URL}/${
                                                creator.username
                                            }/${asset._id.toString()}/${Date.now()}`,
                                            creator: Array.isArray(
                                                asset.assetMetadata.creators
                                                    .formData
                                            )
                                                ? asset.assetMetadata.creators
                                                      .formData[0].name
                                                : 'Unknown Creator',
                                            image: `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`,
                                            description:
                                                asset?.mediaAuxiliary
                                                    ?.description ||
                                                asset.assetMetadata.context
                                                    .formData.description,
                                        });
                                    })
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

                    // OPERATION TYPE: INSERT ASSET
                    if (change.operationType === 'insert') {
                        if (!change.fullDocument) return;

                        status.data.push(
                            change.fullDocument as unknown as AssetsDocument
                        );
                        emitter.emitCreateAsset(change.fullDocument);
                    }

                    // OPERATION TYPE: DELETE ASSET
                    if (change.operationType === 'delete') {
                        // dispatch queue to remove asset from rss
                        await sendToExchangeRSS(
                            JSON.stringify({
                                id: change.documentKey._id.toString(),
                            }),
                            'remove'
                        );

                        status.data = status.data.filter(
                            (item) => item._id !== change.documentKey._id
                        );

                        emitter.emitDeleteAsset(
                            change.documentKey._id.toString()
                        );
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
