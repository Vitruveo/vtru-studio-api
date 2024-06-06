import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';
import {
    APIResponse,
    InsertOneResult,
    InsertManyResult,
    UpdateResult,
    DeleteResult,
} from '../../../services';
import {
    validateBodyForCreate,
    validateBodyForCreateMultiple,
    validateBodyForUpdate,
} from './rules';
import { needsToBeOwner, validateParamsId } from '../../common/rules';
import { Query } from '../../common/types';

const logger = debug('features:waitingList:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get(
    '/',
    needsToBeOwner({
        permissions: ['waiting-list:admin', 'waiting-list:reader'],
    }),
    async (req, res) => {
        try {
            const { query }: { query: Query } = req;

            const waitingList = await model.findWaitingList({
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

            waitingList
                .on('data', (doc) => {
                    res.write('event: waiting_list\n');
                    res.write(`id: ${doc._id}\n`);
                    res.write(`data: ${JSON.stringify(doc)}\n\n`);
                })
                .on('end', () => {
                    res.end();
                });
        } catch (error) {
            logger('Failed to read all waitingList: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.waitingList.reader.all.failed',
                message: `Reader all failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post(
    '/',
    needsToBeOwner({ permissions: ['waiting-list:admin'] }),
    validateBodyForCreate,
    async (req, res) => {
        try {
            const result = await model.addToWaitingList({
                newWaiting: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.waitingList.create.success',
                message: 'Create success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertOneResult<model.WaitingListDocument>>);
        } catch (error) {
            logger('Create waitingList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.waitingList.create.failed',
                message: `Create failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put(
    '/:id',
    needsToBeOwner({ permissions: ['waiting-list:admin'] }),
    validateParamsId,
    validateBodyForUpdate,
    async (req, res) => {
        try {
            const result = await model.updateWaitingList({
                id: req.params.id,
                waitingItem: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.waitingList.update.success',
                message: 'Update success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.WaitingListDocument>>);
        } catch (error) {
            logger('Update waitingList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.waitingList.update.failed',
                message: `Update failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.delete(
    '/:id',
    needsToBeOwner({ permissions: ['waiting-list:admin'] }),
    validateParamsId,
    async (req, res) => {
        try {
            const result = await model.deleteWaitingList({ id: req.params.id });

            res.json({
                code: 'vitruveo.studio.api.admin.waitingList.delete.success',
                message: 'Delete success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<DeleteResult>);
        } catch (error) {
            logger('Delete waitingList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.waitingList.delete.failed',
                message: `Delete failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post(
    '/multiple',
    needsToBeOwner({ permissions: ['waiting-list:admin'] }),
    validateBodyForCreateMultiple,
    async (req, res) => {
        try {
            const result = await model.addMultipleToWaitingList(req.body);

            res.json({
                code: 'vitruveo.studio.api.admin.waitingList.create.multiple.success',
                message: 'Create multiple success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertManyResult<model.WaitingListDocument>>);
        } catch (error) {
            logger('Create multiple waitingList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.waitingList.create.multiple.failed',
                message: `Create multiple failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
