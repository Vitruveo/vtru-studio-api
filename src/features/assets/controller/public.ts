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

        const total = await model.countAssets({ query });
        const totalPage = Math.ceil(total / limitNumber);
        const assets = await model.findAssetsPaginated({
            query: {
                ...query,
                // 'consignArtwork.status': 'active',
            },
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

/**
 * This route will be used to search for an asset from the panel project
 */
route.get('/:id', async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.reader.one.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.show.success',
            message: 'Show asset success',
            transaction: nanoid(),
            data: asset,
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('Show asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.show.failed',
            message: `Show asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
