import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';

const logger = debug('features:assets:controller');
const route = Router();

// TODO: needs to check if user is authenticated
route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    try {
        const assets = await model.findAssets({
            query: {},
            sort: { name: 1 },
            skip: 0,
        });

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        assets
            .on('data', (doc) => {
                res.write('event: asset_list\n');
                res.write(`id: ${doc._id}\n`);
                res.write(`data: ${JSON.stringify(doc)}\n\n`);
            })
            .on('end', () => {
                res.end();
            });
    } catch (error) {
        logger('Reader all assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId
    try {
        const assets = await model.findAssetsById({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: assets,
        } as APIResponse<model.Assets | null>);
    } catch (error) {
        logger('Reader one assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', async (req, res) => {
    try {
        const result = await model.createAssets({ asset: req.body });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.create.success',
            message: 'Create success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult<model.AssetsDocument>>);
    } catch (error) {
        logger('create assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put('/:id', async (req, res) => {
    try {
        const result = await model.updateAssets({
            id: req.params.id,
            asset: req.body,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.update.success',
            message: 'Update success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult<model.AssetsDocument>>);
    } catch (error) {
        logger('Update assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.delete('/:id', async (req, res) => {
    try {
        const result = await model.deleteAssets({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.delete.success',
            message: 'Delete success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<DeleteResult>);
    } catch (error) {
        logger('Delete assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
