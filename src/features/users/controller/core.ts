import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { middleware } from '..';
import * as model from '../model';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';
import { needsToBeOwner, validateParamsId } from '../../common/rules';
import { validateBodyForCreate, validateBodyForUpdate } from './rules';

const logger = debug('features:users:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/:id', validateParamsId, async (req, res) => {
    try {
        const user = await model.findUserById({ id: req.params.id });

        if (!user) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.users.reader.one.not.found',
                message: 'Reader one not found',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.users.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: user,
        } as APIResponse<model.UserDocument>);
    } catch (error) {
        logger('Reader one user failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 24;
        const serch = req.query.search as string;

        let query: any = {};

        if (serch) {
            query = {
                $or: [
                    { name: { $regex: serch, $options: 'i' } },
                    { 'login.email': { $regex: serch, $options: 'i' } },
                ],
            };
        }

        const total = await model.countUsers({ query });
        const totalPage = Math.ceil(total / limit);

        const response = await model.findUsersPaginated({
            query,
            skip: (page - 1) * limit,
            limit,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.users.reader.success',
            message: 'Reader users success',
            transaction: nanoid(),
            data: {
                data: response,
                page,
                totalPage,
                total,
                limit,
            },
        } as APIResponse);
    } catch (error) {
        logger('Reader users failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.reader.failed',
            message: `Reader users failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post(
    '/',
    needsToBeOwner({ permissions: ['user:admin'] }),
    validateBodyForCreate,
    async (req, res) => {
        try {
            const result = await model.createUser({
                user: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.users.create.success',
                message: 'Create success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertOneResult<model.UserDocument>>);
        } catch (error) {
            logger('Create user failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.users.create.failed',
                message: `Create failed: ${error}`,

                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['user:admin'] }),
    validateBodyForUpdate,
    async (req, res) => {
        try {
            const result = await model.updateUser({
                id: req.params.id,
                user: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.users.update.success',
                message: 'Update success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.UserDocument>>);
        } catch (error) {
            logger('Update user failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.users.update.failed',
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
    needsToBeOwner({ permissions: ['user:admin'] }),
    async (req, res) => {
        try {
            const result = await model.deleteUser({ id: req.params.id });

            res.json({
                code: 'vitruveo.studio.api.admin.users.delete.success',
                message: 'Delete success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<DeleteResult>);
        } catch (error) {
            logger('Delete user failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.users.delete.failed',
                message: `Delete failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
