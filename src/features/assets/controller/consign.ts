import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { createConsign } from '../../../services/web3/consign';
import { captureException } from '../../../services';
import { middleware } from '../../users';
import { sendToExchangeRSS } from '../../../services/rss';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';

const logger = debug('features:assets:controller:consign');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        res.write(`event: start_processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);

        const creator = await modelCreator.findCreatorById({ id: req.auth.id });

        if (!creator) throw new Error('creator_not_found');

        // TODO: Verificar se o creator tem walletDefault
        // if (!creator.vault.transactionHash) throw new Error('vault_not_found');

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: creator ${creator._id} is being processed\n\n`);

        const asset = await model.findAssetCreatedBy({
            id: creator._id.toString(),
        });

        if (!asset) throw new Error('asset_not_found');

        if (asset.contractExplorer?.explorer) {
            res.write(`event: consign_success\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(
                `data: ${JSON.stringify({
                    transactionHash: asset.contractExplorer.explorer,
                    assetId: asset.assetRefId,
                })}\n\n`
            );

            return;
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: asset ${asset._id} is being processed\n\n`);

        let creatorRefId = Date.now();
        let assetRefId = Date.now();

        if (asset?.assetRefId) {
            assetRefId = asset.assetRefId;
        }
        if (creator?.creatorRefId) {
            creatorRefId = creator.creatorRefId;
        }

        const licenses = [];

        // TODO: todas as posições 0 do data sempre sera o available
        // TODO: todas as posições 1 do data sempre sera o preço

        const licenseNFT = {
            id: 0,
            licenseTypeId: 1,
            data: [asset.licenses.nft.single.editionPrice * 100],
            info: [
                asset.licenses.nft.editionOption,
                asset.licenses.nft.license,
            ],
        };

        const licenseStream = {
            id: 0,
            licenseTypeId: 2,
            data: [],
            info: [],
        };

        const licenseRemix = {
            id: 0,
            licenseTypeId: 3,
            data: [asset.licenses.remix.unitPrice * 100],
            info: [],
        };

        const licensePrint = {
            id: 0,
            licenseTypeId: 4,
            data: [asset.licenses.print.unitPrice * 100],
            info: [],
        };

        if (asset.licenses.nft.added) {
            licenses.push(licenseNFT);
        }
        if (asset.licenses.stream.added) {
            licenses.push(licenseStream);
        }
        if (asset.licenses.remix.added) {
            licenses.push(licenseRemix);
        }
        if (asset.licenses.print.added) {
            licenses.push(licensePrint);
        }

        if (
            !creator.walletDefault &&
            Array.isArray(creator.wallets) &&
            creator.wallets.length > 0
        ) {
            creator.walletDefault = creator.wallets[0].address;
        }

        const params = {
            header: {
                refId: assetRefId,
                agreeDateTime: Date.now(),
                title: asset?.assetMetadata?.context?.formData?.title || '',
                description:
                    asset?.assetMetadata?.context?.formData?.description || '',
                metadataRefId: Date.now(), // TODO: Implement metadata
            },
            creator: {
                vault: creator.walletDefault,
                refId: creatorRefId,
                split: 10000,
            },
            licenses,
            assetMedia: {
                original: asset?.ipfs?.original || '',
                display: asset?.ipfs?.display || '',
                exhibition: asset?.ipfs?.exhibition || '',
                preview: asset?.ipfs?.preview || '',
                print: asset?.ipfs?.print || '',
            },
            auxiliaryMedia: {
                arImage: asset?.ipfs?.arImage || '',
                arVideo: asset?.ipfs?.arVideo || '',
                btsImage: asset?.ipfs?.btsImage || '',
                btsVideo: asset?.ipfs?.btsVideo || '',
                codeZip: asset?.ipfs?.codeZip || '',
            },
        };

        if (!params.creator.vault) {
            res.write(`event: creator_wallet_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${JSON.stringify(params.creator)}\n\n`);

            throw new Error('creator_wallet_not_found');
        }

        if (!params.assetMedia.original) {
            res.write(`event: asset_media_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${JSON.stringify(params.assetMedia)}\n\n`);

            throw new Error('asset_media_not_found');
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: values are being processed\n\n`);

        const response = await createConsign(params);

        if (!response.transactionHash) {
            res.write(`event: consign_url_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${response.transactionHash}\n\n`);

            throw new Error('consign_url_not_found');
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(
            `data: consign ${response.transactionHash} is being processed\n\n`
        );

        await model.updateAssets({
            id: asset._id.toString(),
            asset: {
                'consignArtwork.status': 'active',
                'consignArtwork.listing': new Date().toISOString(),
                assetRefId,
                contractExplorer: {
                    explorer: response.transactionHash,
                    tx: response.transactionHash,
                    assetId: response.assetId,
                    assetRefId,
                    creatorRefId,
                },
            },
        });

        await modelCreator.updateCreator({
            id: creator._id.toString(),
            creator: { creatorRefId },
        });

        await Promise.all(
            Object.entries(asset.licenses).map(([key, license]) => {
                if (license.added) {
                    try {
                        const payload = JSON.stringify({
                            license: key,
                            id: asset._id.toString(),
                            title: asset.assetMetadata.context.formData.title,
                            url: `${STORE_URL}/${
                                creator.username
                            }/${asset._id.toString()}/${Date.now()}`,
                            creator:
                                asset.assetMetadata.creators.formData[0].name,
                            image: `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`,
                            description:
                                asset?.mediaAuxiliary?.description ||
                                asset.assetMetadata.context.formData
                                    .description,
                        });
                        sendToExchangeRSS(payload, 'consign').then(() => {
                            res.write(`event: rss_${key}\n`);
                            res.write(`id: ${nanoid()}\n`);
                            res.write(`data: ${payload}\n\n`);
                        });
                    } catch (error) {
                        logger(`RSS ${key} failed: %O`, error);
                    }
                }
                return license;
            })
        );

        res.write(`event: consign_success\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${JSON.stringify(response)}\n\n`);
    } catch (error) {
        logger('Consign failed: %O', error);
        captureException(error);

        res.write(`event: consign_error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${error}\n\n`);
    } finally {
        res.end();
    }
});

export { route };
