import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { createContract } from '../../../services/contract';

const logger = debug('features:assets:controller:contract');
const route = Router();

route.post('/:id', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.write('event: asset_not_found\n');
            res.write(`id: ${nanoid()}\n`);
            return;
        }

        if (!asset.framework.createdBy) {
            res.write('event: created_by_found\n');
            res.write(`id: ${nanoid()}\n`);
            return;
        }

        const creator = await modelCreator.findCreatorById({
            id: asset.framework.createdBy.toString(),
        });

        if (!creator) {
            res.write('event: creator_not_found\n');
            res.write(`id: ${nanoid()}\n`);

            return;
        }

        let { assetRefId } = asset;
        let { creatorRefId } = creator;

        if (!assetRefId) {
            assetRefId = Date.now();
        }
        if (!creatorRefId) {
            creatorRefId = Date.now();
        }

        const licenses = [];

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

        const params = {
            header: {
                refId: assetRefId,
                agreeDateTime: Date.now(),
                title: asset.assetMetadata.context.formData.title,
                description:
                    asset.assetMetadata.context.formData.longDescription,
                metadataRefId: Date.now(), // TODO: Implement metadata
            },
            creator: {
                vault: creator.walletDefault,
                refId: creatorRefId,
                split: 10000,
            },
            licenses,
            assetMedia: {
                original: asset.ipfs?.original || '',
                display: asset.ipfs?.display || '',
                exhibition: asset.ipfs?.exhibition || '',
                preview: asset.ipfs?.preview || '',
                print: asset.ipfs?.print || '',
            },
            auxiliaryMedia: {
                arImage: asset.ipfs?.arImage || '',
                arVideo: asset.ipfs?.arVideo || '',
                btsImage: asset.ipfs?.btsImage || '',
                btsVideo: asset.ipfs?.btsVideo || '',
                codeZip: asset.ipfs?.codeZip || '',
            },
        };

        const response = await createContract(params);

        await model.updateAssets({
            id: req.params.id,
            asset: {
                assetRefId,
                contractExplorer: {
                    explorer: response.explorer,
                    tx: response.tx,
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

        res.write(`event: contract_success\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${JSON.stringify(response)}\n\n`);
    } catch (error) {
        logger('Contract  failed: %O', error);
        res.write('event: assets_contract_error\n');
        res.write(`id: ${nanoid()}\n`);
    } finally {
        res.end();
    }
});

export { route };
