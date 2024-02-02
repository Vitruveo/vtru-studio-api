import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';

import { APIResponse } from '../../../services';

import { sendToExchangeCreators } from '../../creators/upload';

const logger = debug('features:assets:controller:notify');
const route = Router();

route.post('/file', async (req, res) => {
    try {
        const asset = await model.findAssetsCodeZipByPath({
            path: req.body.filename,
        });

        if (asset) {
            const creatorId = asset.framework.createdBy;
            await sendToExchangeCreators(
                JSON.stringify({
                    creatorId,
                    fileName: req.body.filename,
                    messageType: 'deleteAsset',
                }),
                'userNotification'
            );
        }

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.notify.file.failed',
                message: `Asset not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.notify.file.success',
            message: 'Reader success',
            transaction: nanoid(),
            data: asset,
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('Reader asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.notify.file.failed',
            message: `Reader failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
