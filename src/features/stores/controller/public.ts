import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';

import { APIResponse } from '../../../services';

const logger = debug('features:stores:controller:core');
const route = Router();

route.get('/validate/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (hash.length !== 64) {
            res.status(400).json({
                code: 'vitruveo.studio.api.stores.validate.failed',
                message: 'Invalid hash',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const store = await model.findStoresByHash(hash);

        if (!store) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.validate.failed',
                message: 'Store not found',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.status(200).json({
            code: 'vitruveo.studio.api.stores.validate.success',
            message: 'Store found',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Validate stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.validate.failed',
            message: `Validate failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
