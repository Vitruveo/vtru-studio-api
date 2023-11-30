import { Router } from 'express';
import * as model from '../model';
import * as middleware from '../middleware';

const route = Router();

// TODO: needs to check if user is authenticated
// route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    const users = await model.findUsers({
        query: {},
        sort: { name: 1 },
        skip: 0,
    });
    res.json(users);
});

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId
    const user = await model.findUserById({ id: req.params.id });
    res.json(user);
});

route.post('/', async (req, res) => {
    const result = await model.createUser({ user: req.body });
    res.json(result);
});

route.put('/:id', async (req, res) => {
    const result = await model.updateUser({
        id: req.params.id,
        user: req.body,
    });
    res.json(result);
});

route.delete('/:id', async (req, res) => {
    const result = await model.deleteUser({ id: req.params.id });
    res.json(result);
});

export { route };
