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
import { needsToBeOwner, validateParamsId } from '../../common/rules';
import { validateBodyForCreate, validateBodyForUpdate } from './rules';

const logger = debug('features:roles:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get(
    '/:id',
    needsToBeOwner({ permissions: ['role:admin'] }),
    validateParamsId,
    async (req, res) => {
        try {
            const role = await model.findRoleById({ id: req.params.id });

            if (!role) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.admin.roles.reader.one.not.found',
                    message: 'Reader one not found',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            res.json({
                code: 'vitruveo.studio.api.admin.roles.reader.one.success',
                message: 'Reader one success',
                transaction: nanoid(),
                data: role,
            } as APIResponse<model.RoleDocument>);
        } catch (error) {
            logger('Reader one role failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.roles.reader.one.failed',
                message: `Reader one failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post(
    '/',
    needsToBeOwner({ permissions: ['role:admin'] }),
    validateBodyForCreate,
    async (req, res) => {
        try {
            const result = await model.createRole({
                role: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.roles.create.success',
                message: 'Create success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertOneResult<model.RoleDocument>>);
        } catch (error) {
            logger('create role failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.roles.create.failed',
                message: `Create failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['role:admin'] }),
    validateBodyForUpdate,
    async (req, res) => {
        try {
            const result = await model.updateRole({
                id: req.params.id,
                role: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.roles.update.success',
                message: 'Update success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.RoleDocument>>);
        } catch (error) {
            logger('Update role failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.roles.update.failed',
                message: `Update failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.delete(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['role:admin'] }),
    async (req, res) => {
        try {
            const result = await model.deleteRole({ id: req.params.id });

            res.json({
                code: 'vitruveo.studio.api.admin.roles.delete.success',
                message: 'Delete success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<DeleteResult>);
        } catch (error) {
            logger('Delete role failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.roles.delete.failed',
                message: `Delete failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
