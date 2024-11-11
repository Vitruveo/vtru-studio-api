import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';
import { middleware } from '../../users';
import { APIResponse } from '../../../services';

import { sendToExchangeCreators } from '../../creators/upload';

const logger = debug('features:stores:controller:upload');
const route = Router();

route.use(middleware.checkAuth);

const formats = {
    logoSquare: 'logo.square',
    logoHorizontal: 'logo.horizontal',
    banner: 'banner',
};

route.post('/request/:id', async (req, res) => {
    const transactionApiId = nanoid();

    try {
        const { mimetype, transactionId, metadata, originalName } = req.body;

        const { id } = req.auth;

        const extension = mimetype.split('/')[1];
        const path = metadata?.path
            ? `${metadata.path}?timestamp=${new Date().getTime()}`
            : `${id}/${new Date().getTime()}.${extension}?timestamp=${new Date().getTime()}`;

        const payload = {
            path,
            creatorId: id,
            transactionId,
            metadata,
            origin: 'stores',
            method: 'PUT',
        };

        console.log('paylad', JSON.stringify(payload, null, 2));

        await sendToExchangeCreators(JSON.stringify(payload), 'stores');

        const store = await model.findStoresById(req.params.id);

        if (!store) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.upload.request.store.not.found',
                message: 'Store not found',
                transaction: transactionApiId,
            } as APIResponse);
            return;
        }

        if (store.framework.createdBy !== id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.stores.upload.request.forbidden',
                message: 'Forbidden',
                transaction: transactionApiId,
            } as APIResponse);
            return;
        }

        await model.updateFormatOrganizations({
            id: req.params.id,
            format: formats[metadata.formatUpload as keyof typeof formats],
            data: {
                name: originalName,
                path,
            },
        });

        res.json({
            code: 'vitruveo.studio.api.stores.upload.request.success',
            message: 'Stores request upload success',
            transaction: transactionApiId,
            data: 'request requested, wait for the URL to upload',
        } as APIResponse<string>);
    } catch (error) {
        logger('Stores request upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.upload.request.failed',
            message: `Stores request upload failed: ${error}`,
            args: error,
            transaction: transactionApiId,
        } as APIResponse);
    }
});

export { route };
