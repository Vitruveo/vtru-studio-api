import { Router } from 'express';
import * as model from '../model';

const route = Router();

// TODO: needs to check if user is authenticated
// route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    const roles = await model.findRoles({
        query: {},
        sort: { name: 1 },
        skip: 0,
    });
    res.json(roles);
});

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId

    const role = await model.findRoleById({ id: req.params.id });
    res.json(role);
});

route.post('/', async (req, res) => {
    const result = await model.createRole({ role: req.body });
    res.json(result);
});

route.put('/:id', async (req, res) => {
    const result = await model.updateRole({
        id: req.params.id,
        role: req.body,
    });
    res.json(result);
});

route.delete('/:id', async (req, res) => {
    const result = await model.deleteRole({ id: req.params.id });
    res.json(result);
});

export { route };
