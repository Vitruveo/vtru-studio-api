import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { middleware } from '../../users';
import { validateQueries } from '../../common/rules';
import { APIResponse } from '../../../services';

const logger = debug('features:requestConsign:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', validateQueries, async (req, res) => {
    try {
        res.json({ message: 'Hello World' });
    } catch (error) {
        logger('Create request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Request Consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
