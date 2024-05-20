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
            transactionHash:
                '0x78e63a3e0831891eef1ad408bfbb3a0baf23e21e02e44d4c35bff6089f04b9e1',
            explorerUrl:
                'https://test-explorer.vitruveo.xyz/tx/0x78e63a3e0831891eef1ad408bfbb3a0baf23e21e02e44d4c35bff6089f04b9e1',
            contractAddress: '0x49ef867a1E9A71992003d89822414d6eddE2D810',
            blockNumber: 3539700,
            vaultAddress: '0x498BA3104AB3e8eFd28f74e0Ff07e401BFc6c087',
            createdAt: new Date(),
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
