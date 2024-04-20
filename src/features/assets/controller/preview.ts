import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { APIResponse } from '../../../services';
import { middleware } from '../../users';

const logger = debug('features:assets:controller:preview');
const route = Router();

route.use(middleware.checkAuth);

route.get('/:id', async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.preview.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (asset.framework.createdBy !== req.auth.id) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.assets.preview.unauthorized',
                message: 'Unauthorized access',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.preview.success',
            message: 'Preview asset success',
            transaction: nanoid(),
            data: asset,
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('preview asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.preview.failed',
            message: `Preview asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
