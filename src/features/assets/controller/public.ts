import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import * as modelCreator from '../../creators/model';
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
        query['formats.preview.path'] = {
            $exists: true,
            $ne: null,
        };

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

route.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await model.findAssetsById({ id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.notFound',
                message: 'Reader get asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creatorId = await asset.framework.createdBy;

        if (!creatorId) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.creatorNotFound',
                message: 'Reader get asset creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creator = await modelCreator.findCreatorById({ id: creatorId });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.creatorNotFound',
                message: 'Reader get asset creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.get.success',
            message: 'Reader get asset success',
            transaction: nanoid(),
            data: {
                username: creator.username,
            },
        } as APIResponse);
    } catch (error) {
        logger('Reader get asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.failed',
            message: `Reader get asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
