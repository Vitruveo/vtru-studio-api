import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as model from '../model';
import { middleware } from '../../users';
import { validateQueries } from '../../common/rules';
import { APIResponse, InsertOneResult, UpdateResult } from '../../../services';
import { findAssetCreatedBy } from '../../assets/model';
import { Query } from '../../common/types';
import { validateBodyForPatch } from './rules';

const logger = debug('features:requestConsign:controller');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', async (req, res) => {
    try {
        const { id } = req.auth;
        const alreadyExists = await model.findRequestConsignsByCreator({
            creator: id,
        });
        if (alreadyExists) {
            res.status(409).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign already exists',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const asset = await findAssetCreatedBy({ id });
        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const requestConsign = model.RequestConsignSchema.parse({
            asset: asset._id.toString(),
            creator: id,
        });

        const result = await model.createRequestConsign({ requestConsign });

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Create request consign success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult<model.RequestConsignDocument>>);
    } catch (error) {
        logger('Create request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Create request Consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/', validateQueries, async (req, res) => {
    try {
        const { query }: { query: Query } = req;

        const requestConsigns = await model.findRequestConsigns({
            query: { limit: query.limit },
            sort: query.sort
                ? { [query.sort.field]: query.sort.order }
                : { name: 1 },
            skip: query.skip || 0,
        });

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        requestConsigns
            .on('data', (doc) => {
                res.write('event: request_consigns_list\n');
                res.write(`id: ${doc._id}\n`);
                res.write(`data: ${JSON.stringify(doc)}\n\n`);
            })
            .on('end', () => {
                res.end();
            });
    } catch (error) {
        logger('Find request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Find request consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.patch('/:id', validateBodyForPatch, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const requestConsign = await model.findRequestConsignsById({ id });

        if (!requestConsign) {
            res.status(404).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const result = await model.updateRequestConsign({
            id,
            requestConsignStatus: status,
        });

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Update request consign success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult<model.RequestConsignDocument>>);
    } catch (error) {
        logger('Update request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Update request consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
