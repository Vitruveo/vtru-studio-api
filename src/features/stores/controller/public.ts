import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';

import { APIResponse } from '../../../services';
import { querySortStores } from '../utils/queries';
import { redis } from '../../../services/redis';

const logger = debug('features:stores:controller:core');
const route = Router();

route.get('/spotlight', async (req, res) => {
    try {
        const spotlight = await redis.get('stores:spotlight');

        res.status(200).json({
            code: 'vitruveo.studio.api.stores.spotlight.success',
            message: 'Spotlight found',
            data: JSON.parse(spotlight || '[]'),
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Spotlight stores failed: %O', error);

        res.status(500).json({
            code: 'vitruveo.studio.api.stores.spotlight',
            message: `Spotlight failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/validate/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        if (hash.length !== 64) {
            res.status(400).json({
                code: 'vitruveo.studio.api.stores.validate.failed',
                message: 'Invalid hash',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const store = await model.findStoresByHash(hash);

        if (!store) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.validate.failed',
                message: 'Store not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (['active', 'pending', 'hidden'].indexOf(store.status) === -1) {
            res.status(403).json({
                code: 'vitruveo.studio.api.stores.validate.forbidden',
                message: 'Store is not valid',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.status(200).json({
            code: 'vitruveo.studio.api.stores.validate.success',
            message: 'Store found',
            transaction: nanoid(),
            data: {
                title: store.organization?.name,
                description: store.organization?.description,
                image: store.organization?.formats.logo.square?.path,
            },
        } as APIResponse);
    } catch (error) {
        logger('Validate stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.validate.failed',
            message: `Validate failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:subdomain', async (req, res) => {
    try {
        const { subdomain } = req.params;

        const store = await model.findStoresBySubdomain(subdomain);

        if (!store) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.find.failed',
                message: 'Store not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.status(200).json({
            code: 'vitruveo.studio.api.stores.find.success',
            message: 'Store found',
            data: store,
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Find stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.find.failed',
            message: `Find failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/', async (req, res) => {
    try {
        let limit = parseInt(req.query.limit as string, 10) || 24;
        const page = parseInt(req.query.page as string, 10) || 1;
        const sort = req.query.sort as string;
        const search = req.query.search as string;

        if (limit > 200) {
            limit = 200;
        }

        const query: any = {
            status: 'active',
        };

        if (search && search?.length) {
            query.search = search;
        }

        const total = await model.countStores({ query });
        const totalPage = Math.ceil(total / limit);

        const sortQuery = querySortStores(sort);
        const stores = await model.findStoresPaginatedPublic({
            query,
            skip: (page - 1) * limit,
            limit,
            sort: sortQuery,
        });

        res.status(200).json({
            code: 'vitruveo.studio.api.stores.list.success',
            message: 'Stores found',
            data: {
                data: stores,
                page,
                totalPage,
                total,
                limit,
            },
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('List stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.list.failed',
            message: `List failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
