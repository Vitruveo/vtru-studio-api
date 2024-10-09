import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { APIResponse } from '../../../services';

import * as model from '../model';

const logger = debug('features:creators:controller:puiblic');
const route = Router();

route.get('/stack', async (req, res) => {
    try {
        // const page = parseInt(req.query.page as string, 10) || 1;
        let limit = parseInt(req.query.limit as string, 10) || 25;

        if (limit > 200) limit = 200;

        const stacks = await model.findCreatorsStacks();

        res.json({
            code: 'vitruveo.studio.api.creators.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: stacks,
        } as APIResponse);
    } catch (error) {
        logger('Reader search creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creators.search.failed',
            message: 'Reader search failed',
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
