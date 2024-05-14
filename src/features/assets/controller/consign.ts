import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { captureException } from '../../../services';
import { middleware } from '../../users';

import * as model from '../model';
import {
    C2PA_SUCCESS,
    IPFS_SUCCESS,
    CONSIGN_SUCCESS,
    emitter,
} from '../emitter';
import { sendToExchangeConsign } from '../queue';

const logger = debug('features:assets:controller:consign');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        const asset = await model.findAssetCreatedBy({ id: req.auth.id });
        if (!asset) throw new Error('Asset not found');

        if (
            !asset?.consignArtwork?.status ||
            asset.consignArtwork.status !== 'processing'
        ) {
            await model.updateAssets({
                id: asset._id,
                asset: {
                    'consignArtwork.status': 'processing',
                },
            });
            const message = JSON.stringify(asset);
            await sendToExchangeConsign(message);
        }

        const sendEvent = (data: any, eventType: string) => {
            res.write(`event: ${eventType}\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);

            if (eventType === CONSIGN_SUCCESS) {
                res.end();
            }
        };

        // history
        if (asset?.c2pa?.finishedAt) {
            sendEvent(asset.c2pa, C2PA_SUCCESS);
        }
        if (asset?.ipfs?.finishedAt) {
            sendEvent(asset.ipfs, IPFS_SUCCESS);
        }
        if (asset?.contractExplorer?.finishedAt) {
            sendEvent(asset.contractExplorer, CONSIGN_SUCCESS);
        }

        // live
        const sendEventC2PA = (data: model.Assets['c2pa']) => {
            sendEvent(data, C2PA_SUCCESS);
        };
        emitter.on(C2PA_SUCCESS, sendEventC2PA);

        const sendEventIPFS = (data: model.Assets['ipfs']) => {
            sendEvent(data, IPFS_SUCCESS);
        };
        emitter.on(IPFS_SUCCESS, sendEventIPFS);

        const sendEventConsign = (data: model.Assets['consignArtwork']) => {
            sendEvent(data, CONSIGN_SUCCESS);
        };
        emitter.on(CONSIGN_SUCCESS, sendEventConsign);

        const removeListeners = () => {
            emitter.off(C2PA_SUCCESS, sendEventC2PA);
            emitter.off(IPFS_SUCCESS, sendEventIPFS);
            emitter.off(CONSIGN_SUCCESS, sendEventConsign);
        };
        res.on('close', removeListeners);
        res.on('error', removeListeners);
        res.on('finish', removeListeners);
    } catch (error) {
        logger('Consign failed: %O', error);
        captureException(error);

        res.write(`event: consign_error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${error}\n\n`);

        res.end();
    }
});

export { route };
