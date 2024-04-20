/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { ASSET_STORAGE_URL } from '../../../constants';
import * as model from '../model';
import type { DataIPFS } from './types';
import { uploadToIPFS } from '../../../services/ipfs';
import { captureException } from '../../../services';

const logger = debug('features:assets:controller:ipfs');
const route = Router();

route.post('/:id', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        res.write(`event: start_processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.write(`event: asset_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${req.params.id}\n\n`);

            throw new Error('asset_not_found');
        }

        // update last . to _signed.
        const originalSigned = asset.formats?.original?.path.replace(
            /\.(?=[^.]*$)/,
            '_signed.'
        );

        const filesRaw = {
            // Main
            original: originalSigned,
            preview: asset.formats?.preview?.path,
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

            res.write(`event: processing\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: file ${file.name} is being processed\n\n`);

            // save response on data
            data[file.name] = response.data.Hash;
        }

        // save on asset
        await model.updateAssets({
            id: req.params.id,
            asset: { ipfs: data },
        });

        res.write(`event: ipfs_success\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);
    } catch (error) {
        logger('Contract  failed: %O', error);
        captureException(error);

        res.write(`event: ipfs_error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${error}\n\n`);
    } finally {
        res.end();
    }
});

export { route };
