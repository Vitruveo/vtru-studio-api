/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { APIResponse } from '../../../services';
import { ASSET_STORAGE_URL } from '../../../constants';
import * as model from '../model';
import type { DataIPFS } from './types';
import { uploadToIPFS } from '../../../services/ipfs';

const logger = debug('features:assets:controller:ipfs');
const route = Router();

route.post('/:id', async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.ipfs.assetNotFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // update last . to _signed.
        // const originalSigned = asset.formats?.original?.path.replace(
        //     /\.(?=[^.]*$)/,
        //     '_signed.'
        // );

        const filesRaw = {
            // Main
            preview: asset.formats?.preview?.path,
            original: asset.formats?.original?.path,
            exhibition: asset.formats?.exhibition?.path,
            display: asset.formats?.display?.path,
            print: asset.formats?.print?.path,

            // Auxiliary
            arImage: asset.mediaAuxiliary?.formats?.arImage?.path,
            arVideo: asset.mediaAuxiliary?.formats?.arVideo?.path,
            btsImage: asset.mediaAuxiliary?.formats?.btsImage?.path,
            btsVideo: asset.mediaAuxiliary?.formats?.btsVideo?.path,
            codeZip: asset.mediaAuxiliary?.formats?.codeZip?.path,
        };

        const files = Object.entries(filesRaw)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, value]) => Boolean(value)) // Remove empty values
            .map(([key, value]) => ({
                // add url to each file
                name: key,
                url: `${ASSET_STORAGE_URL}/${value}`,
            }));

        const data: DataIPFS = {};

        for (const file of files) {
            // send file to ipfs
            const response = await uploadToIPFS({ url: file.url });

            // save response on data
            data[file.name] = response.data.Hash;
        }

        // save on asset
        await model.updateAssets({
            id: req.params.id,
            asset: { ipfs: data },
        });

        res.json({
            code: 'vitruveo.studio.api.assets.ipfs.success',
            message: 'IPFS success',
            transaction: nanoid(),
            data,
        } as APIResponse<DataIPFS>);
    } catch (error) {
        logger('IPFS  failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.ipfs.failed',
            message: `IPFS failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
