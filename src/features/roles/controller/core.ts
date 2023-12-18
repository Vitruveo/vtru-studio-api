import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';
import { Query } from '../../common/types';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';
import {
    needsToBeOwner,
    validateParamsId,
    validateQueries,
} from '../../common/rules';
import { validateBodyForCreate, validateBodyForUpdate } from './rules';

const logger = debug('features:roles:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', validateQueries, async (req, res) => {
    try {
        const { query }: { query: Query } = req;

        const roles = await model.findRoles({
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

        roles
            .on('data', (doc) => {
                res.write('event: role_list\n');
                res.write(`id: ${doc._id}\n`);
                res.write(`data: ${JSON.stringify(doc)}\n\n`);
            })
            .on('end', () => {
                res.end();
            });
    } catch (error) {
        logger('Reader all role failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.roles.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.get('/:id', validateParamsId, async (req, res) => {
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
});

route.post('/', validateBodyForCreate, async (req, res) => {
    try {
        const result = await model.createRole({
            role: req.body,
            createdBy: req.auth.id,
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
});

route.put(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['roles:admin', 'roles:editor'] }),
    validateBodyForUpdate,
    async (req, res) => {
        try {
            const result = await model.updateRole({
                id: req.params.id,
                role: req.body,
                updatedBy: req.auth.id,
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
    needsToBeOwner({ permissions: ['roles:admin', 'roles:editor'] }),
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
