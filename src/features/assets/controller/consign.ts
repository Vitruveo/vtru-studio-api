import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { ZodError } from 'zod';

import * as model from '../model';
import { middleware } from '../../users';
import { APIResponse, ObjectId, captureException } from '../../../services';
import { schemaAssetValidation } from './schemaValidate';
import { formatErrorMessage } from '../../../utils';
import { mustBeOwner } from '../middleware';

const logger = debug('features:assets:controller:consign');
const route = Router();

route.use(middleware.checkAuth);

route.get('/validation/:id', mustBeOwner, async (req, res) => {
    try {
        const asset = await model.findOneAssets({
            query: {
                _id: new ObjectId(req.params.id),
            },
        });

        schemaAssetValidation.parse(asset);

        return res.json({
            code: 'vitruveo.studio.api.assets.consign.validation.success',
            message: 'Consign validation success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Consign validation failed: %O', error);
        captureException(
            {
                message: 'Consign validation failed',
                error: error instanceof Error ? error.message : error,
                creator: req.auth.id,
            },
            { tags: { scope: 'consign' } }
        );

        return res.status(400).json({
            code: 'vitruveo.studio.api.assets.consign.validation.error',
            message: 'Consign validation error',
            transaction: nanoid(),
            args: error instanceof ZodError ? formatErrorMessage(error) : error,
        } as APIResponse);
    }
});

export { route };
