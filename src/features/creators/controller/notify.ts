import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { APIResponse } from '../../../services';
import { middleware } from '../../users';

const logger = debug('features:creators:controller:notify');
const route = Router();

route.use(middleware.checkAuth);

route.get('/signed', async (req, res) => {
    try {
        // set creator as signed

        // notify frontend via socket.io

        // started processing IPFS

        res.json({
            code: 'vitruveo.studio.api.creators.notify.signed.success',
            message: 'signed asset to creator success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('signed asset to creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creators.notify.signed.failed',
            message: `signed asset to creator failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
