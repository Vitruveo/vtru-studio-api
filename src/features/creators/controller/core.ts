import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';

const logger = debug('features:creators:controller');
const route = Router();

// TODO: needs to check if creator is authenticated
// route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    try {
        const creators = await model.findCreators({
            query: {},
            sort: { name: 1 },
            skip: 0,
        });

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        creators
            .on('data', (doc) => {
                res.write('event: creator_list\n');
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
        logger('Reader all creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId
    try {
        const creator = await model.findCreatorById({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: creator,
        });
    } catch (error) {
        logger('Reader one creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.post('/', async (req, res) => {
    try {
        const result = await model.createCreator({ creator: req.body });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.create.success',
            message: 'Create success',
            transaction: nanoid(),
            data: result,
        });
    } catch (error) {
        logger('Create creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.put('/:id', async (req, res) => {
    try {
        const result = await model.updateCreator({
            id: req.params.id,
            creator: req.body,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.update.success',
            message: 'Update success',
            transaction: nanoid(),
            data: result,
        });
    } catch (error) {
        logger('Update creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.delete('/:id', async (req, res) => {
    try {
        const result = await model.deleteCreator({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.delete.success',
            message: 'Delete success',
            transaction: nanoid(),
            data: result,
        });
    } catch (error) {
        logger('Delete creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

export { route };
