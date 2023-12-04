import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';

const logger = debug('features:roles:controller');
const route = Router();

// TODO: needs to check if user is authenticated
// route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    try {
        const roles = await model.findRoles({
            query: {},
            sort: { name: 1 },
            skip: 0,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.roles.reader.all.success',
            message: 'Reader all success',
            transaction: nanoid(),
            data: roles,
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

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId
    try {
        const role = await model.findRoleById({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.roles.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: role,
        });
    } catch (error) {
        logger('Reader one role failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.roles.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.post('/', async (req, res) => {
    try {
        const result = await model.createRole({ role: req.body });

        res.json({
            code: 'vitruveo.studio.api.admin.roles.create.success',
            message: 'Create success',
            transaction: nanoid(),
            data: result,
        });
    } catch (error) {
        logger('create role failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.roles.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.put('/:id', async (req, res) => {
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
        });
    } catch (error) {
        logger('Update role failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.roles.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.delete('/:id', async (req, res) => {
    try {
        const result = await model.deleteRole({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.roles.delete.success',
            message: 'Delete success',
            transaction: nanoid(),
            data: result,
        });
    } catch (error) {
        logger('Delete role failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.roles.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

export { route };
