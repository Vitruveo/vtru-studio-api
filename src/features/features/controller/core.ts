import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';
import {
    APIResponse,
    InsertOneResult,
    UpdateResult,
    DeleteResult,
} from '../../../services';
import { validateBodyForCreate, validateBodyForUpdate } from './rules';
import { validateParamsId } from '../../common/rules';

const logger = debug('features:features:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/check/:email', async (req, res) => {
    try {
        const features = await model.checkEmailExist({
            email: req.params.email,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.features.email.success',
            message: 'Checked email with success',
            transaction: nanoid(),
            data: features.map((v) => v.name),
        } as APIResponse<string[]>);
    } catch (error) {
        logger('Exist email features failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.features.email.failed',
            message: `Exist email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/', async (req, res) => {
    try {
        const features = await model.getFeatures();

        res.json({
            code: 'vitruveo.studio.api.admin.features.reader.all.success',
            message: 'Reader all success',
            transaction: nanoid(),
            data: features,
        } as APIResponse<model.FeatureDocument[]>);
    } catch (error) {
        logger('Reader all features failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.features.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', validateBodyForCreate, async (req, res) => {
    try {
        const result = await model.addFeature({
            newFeature: req.body,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.features.create.success',
            message: 'Create success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult<model.FeatureDocument>>);
    } catch (error) {
        logger('Create features failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.features.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put('/:id', validateParamsId, validateBodyForUpdate, async (req, res) => {
    try {
        const result = await model.updateFeature({
            id: req.params.id,
            feature: req.body,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.features.update.success',
            message: 'Update success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult<model.FeatureDocument>>);
    } catch (error) {
        logger('Update features failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.features.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.delete('/:id', validateParamsId, async (req, res) => {
    try {
        const result = await model.deleteFeature({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.features.delete.success',
            message: 'Delete success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<DeleteResult>);
    } catch (error) {
        logger('Delete features failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.features.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
