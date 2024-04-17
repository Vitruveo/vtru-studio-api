import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { APIResponse } from '../../../services';

const logger = debug('features:assets:controller:contract');
const route = Router();

route.post('/', async (req, res) => {
    try {
        // TODO: integrar com o codigo do Nik

        res.json({
            code: 'vitruveo.studio.api.assets.contract.success',
            message: 'Contract success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Contract  failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.contract.failed',
            message: `Contract failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
