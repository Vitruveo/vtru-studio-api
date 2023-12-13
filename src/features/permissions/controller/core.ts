import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';

const logger = debug('features:permissions:controller');
const route = Router();

// TODO: needs to check if user is authenticated
route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    try {
        const permissions = await model.findPermissions({
            query: {},
            sort: { name: 1 },
            skip: 0,
        });

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        permissions
            .on('data', (doc) => {
                res.write('event: permission_list\n');
                res.write(`id: ${doc._id}\n`);
                res.write(`data: ${JSON.stringify(doc)}\n\n`);
            })
            .on('end', () => {
                res.end();
            });
    } catch (error) {
        logger('Reader all permissions failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.permissions.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

// route.get('/:id', async (req, res) => {
//     // TODO: needs to check if id is valid ObjectId
//     const permission = await model.findPermissionById({ id: req.params.id });
//     res.json(permission);
// });

// route.post('/', async (req, res) => {
//     const result = await model.createPermission({ permission: req.body });
//     res.json(result);
// });

// route.put('/:id', async (req, res) => {
//     const result = await model.updatePermission({
//         id: req.params.id,
//         permission: req.body,
//     });
//     res.json(result);
// });

// route.delete('/:id', async (req, res) => {
//     const result = await model.deletePermission({ id: req.params.id });
//     res.json(result);
// });

export { route };
