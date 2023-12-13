import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';

const logger = debug('features:users:controller');
const route = Router();

// TODO: needs to check if user is authenticated
// route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    try {
        const users = await model.findUsers({
            query: {},
            sort: { name: 1 },
            skip: 0,
        });

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        users
            .on('data', (doc) => {
                res.write('event: user_list\n');
                res.write(`id: ${doc._id}\n`);
                res.write(`data: ${JSON.stringify(doc)}\n\n`);
            })
            .on('end', () => {
                res.write('event: close\n');
                res.write(`id: ${nanoid()}\n`);
                res.write(`data: {}\n\n`);

                res.end();
            });
    } catch (error) {
        logger('Reader all users failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId
    try {
        const user = await model.findUserById({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.users.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: user,
        } as APIResponse<model.UserDocument | null>);
    } catch (error) {
        logger('Reader one users failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', async (req, res) => {
    try {
        const result = await model.createUser({ user: req.body });

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
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put('/:id', async (req, res) => {
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
});

route.delete('/:id', async (req, res) => {
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
});

export { route };
