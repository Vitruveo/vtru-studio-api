import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';
import { APIResponse } from '../../../services';
import { Query } from '../../common/types';
import { validateQueries } from '../../common/rules';

const logger = debug('features:permissions:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', validateQueries, async (req, res) => {
    try {
        const { query }: { query: Query } = req;

        const permissions = await model.findPermissions({
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
        } as APIResponse);
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
