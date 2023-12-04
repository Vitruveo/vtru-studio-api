import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';

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

        res.json({
            code: 'vitruveo.studio.api.admin.users.reader.all.success',
            message: 'Reader all success',
            transaction: nanoid(),
            data: users,
        });
    } catch (error) {
        logger('Reader all users failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Reader one users failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Create user failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Update user failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Delete user failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

export { route };
