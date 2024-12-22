import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { sendToExchangeTemplate } from '../../../services/upload';
import { APIResponse } from '../../../services/express';

const logger = debug('features:templates:controller');
const route = Router();

route.post('/image/upload', async (req, res) => {
    const transactionApiId = nanoid();

    try {
        const { mimetype, transactionId, metadata, name, userId } = req.body;

        const extension = mimetype.split('/')[1];
        const path = `${name}.${extension}`;

        await sendToExchangeTemplate(
            JSON.stringify({
                path,
                userId,
                transactionId,
                metadata,
            }),
            'image'
        );

        res.json({
            code: 'vitruveo.studio.api.templates.image.upload.success',
            message: 'Template image upload success',
            transaction: transactionApiId,
        } as APIResponse<string>);
    } catch (error) {
        logger('Template image upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.templates.image.upload.failed',
            message: `Template image upload failed: ${error}`,
            args: error,
            transaction: transactionApiId,
        } as APIResponse);
    }
});

route.post('/json/upload', async (req, res) => {
    try {
        await sendToExchangeTemplate(JSON.stringify(req.body), 'json');

        res.json({
            code: 'vitruveo.studio.api.templates.json.upload.success',
            message: 'Template json upload success',
            transaction: nanoid(),
        } as APIResponse<string>);
    } catch (error) {
        logger('Template json upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.templates.json.upload.failed',
            message: `Template json upload failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
