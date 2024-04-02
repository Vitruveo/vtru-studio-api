import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { APIResponse } from '../../../services';
import { QueryPaginatedParams, ResponseAssetsPaginated } from './types';

const logger = debug('features:assets:controller:public');
const route = Router();

route.get('/search', async (req, res) => {
    try {
        const {
            query = {},
            sort,
            page = 1,
            limit = 10,
        } = req.query as unknown as QueryPaginatedParams;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        query['consignArtwork.status'] = 'active';

        const total = await model.countAssets({ query });
        const totalPage = Math.ceil(total / limitNumber);
        const assets = await model.findAssetsPaginated({
            query,
            sort,
            skip: (pageNumber - 1) * limitNumber,
            limit: limitNumber,
        });
        const tags = await model.findAssetsTags({ query });

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                tags,
                page: pageNumber,
                totalPage,
                total,
                limit: limitNumber,
            },
        } as APIResponse<ResponseAssetsPaginated>);
    } catch (error) {
        logger('Reader search asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.search.failed',
            message: `Reader search failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
