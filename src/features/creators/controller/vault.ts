import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';
import { captureException } from '../../../services';
import { middleware } from '../../users';

const logger = debug('features:creators:controller:vault');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        res.write(`event: start_processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);

        // start processing

        // save vault to creator
        const response = {
            transactionHash: nanoid(),
            vaultAddress: '',
            createdAt: new Date(),
            isBlocked: false,
            isTrusted: false,
        };

        await model.updateCreator({
            id: req.auth.id,
            creator: {
                vault: response,
            },
        });

        res.write(`event: vault_success\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${JSON.stringify(response)}\n\n`);
    } catch (error) {
        logger('Vault failed: %O', error);
        captureException(error);

        res.write(`event: vault_error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${error}\n\n`);
    } finally {
        res.end();
    }
});

export { route };
