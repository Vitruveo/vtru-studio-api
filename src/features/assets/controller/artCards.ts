import debug from 'debug';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { APIResponse } from '../../../services';
import { middleware } from '../../users';
import * as model from '../model';
import { schemaAssetArtCardsStatus } from './schemas';

const logger = debug('features:assets:controller:artCards');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const total = await model.countAssetsWithLicenseArtCards({ status });

        const data = await model.findAssetsWithArtCardsPaginated({
            query: {
                status,
                search,
            },
            limit,
            skip: (page - 1) * limit,
            sort: {
                'assetMetadata.context.formData.title': 1,
            },
        });

        const totalPage = Math.ceil(total / limit);

        res.json({
            code: 'vitruveo.studio.api.assets.artCards.success',
            message: 'artCards asset success',
            transaction: nanoid(),
            data: {
                data,
                page,
                totalPage,
                total,
                limit,
            },
        } as APIResponse);
    } catch (error) {
        logger('artCards asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.artCards.failed',
            message: `artCards asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body as {
            status: z.infer<typeof schemaAssetArtCardsStatus>;
        };

        await model.updateAssetArtCardsStatus({ id, status });

        res.json({
            code: 'vitruveo.studio.api.assets.artCards.update.success',
            message: 'artCards asset update success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('artCards asset update failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.artCards.update.failed',
            message: `artCards asset update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
