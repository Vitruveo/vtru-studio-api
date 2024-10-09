import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { APIResponse } from '../../../services';
import { QueryPaginatedParams } from './types';
import * as model from '../model';

const logger = debug('features:creators:controller:puiblic');
const route = Router();

route.get('/search', async (req, res) => {
    try {
        const { page = 1, limit = 10 } =
            req.query as unknown as QueryPaginatedParams;

        const pageNumber = Number(page);
        let limitNumber = Number(limit);

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.creators.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (limitNumber > 200) limitNumber = 200;

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
