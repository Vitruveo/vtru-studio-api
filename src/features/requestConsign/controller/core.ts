import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as model from '../model';
import { middleware } from '../../users';
import { validateQueries } from '../../common/rules';
import { APIResponse, InsertOneResult } from '../../../services';
import { findAssetCreatedBy } from '../../assets/model';
import { RequestConsignProps } from './types';
import { Query } from '../../common/types';

const logger = debug('features:requestConsign:controller');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', validateQueries, async (req, res) => {
    try {
        const { id } = req.auth;
        const asset = await findAssetCreatedBy({ id });

        const requestConsign: RequestConsignProps = {
            asset: asset?._id.toString()!,
            creator: id,
            when: new Date(),
            status: 'pending',
        };

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
                res.write('event: creator_list\n');
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

export { route };
