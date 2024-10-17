import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { APIResponse } from '../../../services';

import * as model from '../model';
import { querySortStacks } from '../utils/queries';

const logger = debug('features:creators:controller:public');
const route = Router();

route.get('/stacks', async (req, res) => {
    try {
        const sort = (req.query.sort as string) || 'latest';
        const page = parseInt(req.query.page as string, 10) || 1;
        let limit = parseInt(req.query.limit as string, 10) || 25;

        if (limit > 200) limit = 200;
        const sortQuery = querySortStacks(sort);

        const query = {
            search: { $exists: true },
        };

        const stacks = await model.findCreatorsStacks({
            query,
            skip: (page - 1) * limit,
            limit,
            sort: sortQuery,
        });
        const totalStacks = await model.countCreatorStacks({ query });

        res.json({
            code: 'vitruveo.studio.api.creators.stack.success',
            message: 'Reader stack success',
            transaction: nanoid(),
            data: {
                data: stacks,
                page,
                totalPage: Math.ceil(totalStacks / limit),
                total: totalStacks,
                limit,
            },
        } as APIResponse);
    } catch (error) {
        logger('Reader stack creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creators.stack.failed',
            message: 'Reader stack failed',
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
