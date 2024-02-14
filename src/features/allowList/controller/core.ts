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

const logger = debug('features:allowList:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', needsToBeOwner({ permissions: ['admin'] }), async (req, res) => {
    try {
        const allowList = await model.getAllowList();

        res.json({
            code: 'vitruveo.studio.api.admin.allowList.reader.all.success',
            message: 'Reader all success',
            transaction: nanoid(),
            data: allowList,
        } as APIResponse<model.AllowListDocument[]>);
    } catch (error) {
        logger('Reader all allowList failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.allowList.reader.all.failed',
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
            const result = await model.addToAllowList({
                newAllow: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.allowList.create.success',
                message: 'Create success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertOneResult<model.AllowListDocument>>);
        } catch (error) {
            logger('Create allowList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.allowList.create.failed',
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
            const result = await model.updateAllowList({
                id: req.params.id,
                allow: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.allowList.update.success',
                message: 'Update success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.AllowListDocument>>);
        } catch (error) {
            logger('Update allowList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.allowList.update.failed',
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
            const result = await model.deleteAllowList({ id: req.params.id });

            res.json({
                code: 'vitruveo.studio.api.admin.allowList.delete.success',
                message: 'Delete success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<DeleteResult>);
        } catch (error) {
            logger('Delete allowList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.allowList.delete.failed',
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
            const result = await model.addMultipleToAllowList(req.body);

            res.json({
                code: 'vitruveo.studio.api.admin.allowList.create.multiple.success',
                message: 'Create multiple success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertManyResult<model.AllowListDocument>>);
        } catch (error) {
            logger('Create multiple allowList failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.allowList.create.multiple.failed',
                message: `Create multiple failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
