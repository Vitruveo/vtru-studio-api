import { Router } from 'express';
import * as model from '../model';

const route = Router();

// TODO: needs to check if user is authenticated
// route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    const permissions = await model.findPermissions({
        query: {},
        sort: { name: 1 },
        skip: 0,
    });
    res.json(permissions);
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
