import debug from 'debug';
import { nanoid } from 'nanoid';

import { Router } from 'express';

import type { APIResponse } from '../../../services/express';

const logger = debug('features:creators:controller:gallery');
const route = Router();

route.get('/:timestamp', async (req, res) => {
    try {
        res.json({
            code: 'vitruveo.studio.api.creator.get.gallery.success',
            message: 'Get gallery success',
            transaction: nanoid(),
        } as APIResponse<string>);
    } catch (error) {
        logger('Get gallery failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.get.gallery.failed',
            message: `Get gallery failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
