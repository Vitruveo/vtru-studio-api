import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { APIResponse } from '../../../services';
import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { createContract } from '../../../services/contract';
import { ResponseCreateContract } from './types';

const logger = debug('features:assets:controller:contract');
const route = Router();

route.post('/:id', async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.contract.not_found',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (!asset.framework.createdBy) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.contract.creator_not_found',
                message: 'CreatedBy not found',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const creator = await modelCreator.findCreatorById({
            id: asset.framework.createdBy.toString(),
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.contract.creator_not_found',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const assetRefId = Date.now() + 1;
        const creatorRefId = Date.now() + 2;

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
                description: asset.assetMetadata.context.formData.description,
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
                contractExplorer: {
                    explorer: response.explorer,
                    tx: response.tx,
                    assetId: response.assetId,
                },
            },
        });

        res.json({
            code: 'vitruveo.studio.api.assets.contract.success',
            message: 'Contract success',
            transaction: nanoid(),
            data: response,
        } as APIResponse<ResponseCreateContract>);
    } catch (error) {
        logger('Contract  failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.contract.failed',
            message: `Contract failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
