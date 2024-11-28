import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { z } from 'zod';

import * as model from '../model';
import { middleware } from '../../users';
import { APIResponse } from '../../../services';
import {
    validateBodyForCreateStores,
    validateBodyForUpdateStepStores,
} from './rules';
import { schemaValidationStepName } from './schemas';
import { querySorStoreCreatorById } from '../utils/queries';

const logger = debug('features:stores:controller:core');
const route = Router();

const statusMapper = {
    draft: { status: 'draft' },
    active: { status: 'active' },
    inactive: { status: 'inactive' },
    all: {},
};

route.use(middleware.checkAuth);

route.post('/', validateBodyForCreateStores, async (req, res) => {
    try {
        let clone: {
            organization: model.StoresDocument['organization'];
        } | null = null;

        const payload = req.body;

        if (payload.cloneId) {
            const store = await model.findStoresById(payload.cloneId);

            if (!store) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.stores.clone.not.found',
                    message: 'Clone not found',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            if (store.framework.createdBy !== req.auth.id) {
                res.status(403).json({
                    code: 'vitruveo.studio.api.stores.clone.forbidden',
                    message: 'Clone forbidden',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            if (!store?.actions) {
                store.actions = { countClone: 0 };
            } else if (!store.actions.countClone) {
                store.actions.countClone = 0;
            }

            store.actions.countClone += 1;

            await model.updateStores({
                id: store._id.toString(),
                data: store,
            });

            clone = {
                organization: store.organization,
            };
            clone.organization.url += `-${store.actions.countClone}`;
        }

        const response = await model.createStores({
            ...payload,
            ...(clone && clone),
        });

        res.json({
            code: 'vitruveo.studio.api.stores.create.success',
            message: 'Create stores success',
            transaction: nanoid(),
            data: response,
        } as APIResponse);
    } catch (error) {
        logger('Creator stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.failed',
            message: `Creator stores failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/me', async (req, res) => {
    try {
        const status = req.query.status as keyof typeof statusMapper;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 24;
        const sort = req.query.sort as string;

        const query: any = {
            'framework.createdBy': req.auth.id,
            ...(statusMapper[status] || statusMapper.all),
        };

        const sortQuery = querySorStoreCreatorById(sort);
        const total = await model.countStoresByCreator({ query });
        const totalPage = Math.ceil(total / limit);

        const response = await model.findStoresByCreatorPaginated({
            query,
            skip: (page - 1) * limit,
            limit,
            sort: sortQuery,
        });

        res.json({
            code: 'vitruveo.studio.api.stores.reader.all.success',
            message: 'Reader all success',
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
        logger('Reader all stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.reader.all.failed',
            message: `Reader all stores failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', async (req, res) => {
    try {
        const response = await model.findStoresById(req.params.id);

        if (!response) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.reader.one.not.found',
                message: 'Reader one not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (response?.framework.createdBy !== req.auth.id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.stores.reader.one.forbidden',
                message: 'Reader one forbidden',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.stores.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: response,
        } as APIResponse);
    } catch (error) {
        logger('Reader one stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.delete('/:id', async (req, res) => {
    try {
        const stores = await model.findStoresById(req.params.id);

        if (!stores) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.delete.not.found',
                message: 'Delete not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (stores.framework.createdBy !== req.auth.id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.stores.delete.forbidden',
                message: 'Delete forbidden',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        await model.deleteStores(req.params.id);

        res.json({
            code: 'vitruveo.studio.api.stores.delete.success',
            message: 'Delete success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Delete stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.patch('/:id', validateBodyForUpdateStepStores, async (req, res) => {
    try {
        const stores = await model.findStoresById(req.params.id);

        if (!stores) {
            res.status(404).json({
                code: 'vitruveo.studio.api.stores.update.not.found',
                message: 'Update not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (stores.framework.createdBy !== req.auth.id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.stores.update.forbidden',
                message: 'Update forbidden',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const payload = req.body as z.infer<typeof schemaValidationStepName>;

        await model.updateStepStores({
            id: req.params.id,
            stepName: payload.stepName,
            data: {
                ...payload.data,
                formats: stores.organization.formats,
            },
        });

        res.json({
            code: 'vitruveo.studio.api.stores.update.success',
            message: 'Update success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Update stores failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/validateUrl/:id', async (req, res) => {
    try {
        const url = req.body.url as string;

        const response = await model.CheckUrlIsUnique({
            id: req.params.id,
            url,
        });

        res.json({
            code: 'vitruveo.studio.api.stores.validateUrl.success',
            message: 'Validate url success',
            transaction: nanoid(),
            data: !response?._id,
        } as APIResponse);
    } catch (error) {
        logger('Validate url failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.stores.validateUrl.failed',
            message: `Validate url failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
