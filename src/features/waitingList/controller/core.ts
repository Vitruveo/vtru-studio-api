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

const logger = debug('features:waitingList:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', needsToBeOwner({ permissions: ['admin'] }), async (req, res) => {
    try {
        const waitingList = await model.getWaitingList();

        res.json({
            code: 'vitruveo.studio.api.admin.waitingList.reader.all.success',
            message: 'Reader all success',
            transaction: nanoid(),
            data: waitingList,
        } as APIResponse<model.WaitingListDocument[]>);
    } catch (error) {
        logger('Reader all waitingList failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.waitingList.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post(
    '/',
    needsToBeOwner({ permissions: ['admin'] }),
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
    needsToBeOwner({ permissions: ['admin'] }),
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
    needsToBeOwner({ permissions: ['admin'] }),
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
    needsToBeOwner({ permissions: ['admin'] }),
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
