import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { APIResponse } from '../../../services';
import { responseRenderUrl } from '../utils/responseRenderUrl';

const logger = debug('features:assets:controller:store');
const route = Router();

route.get('/:id/html', async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const html = responseRenderUrl({
            creatorName: asset.framework.createdBy || '',
            assetId: asset._id.toString(),
            title: asset.assetMetadata.context.formData.title,
            description: asset.assetMetadata.context.formData.description,
            image: asset.formats.preview?.path || '',
        });

        res.send(html);
    } catch (error) {
        logger('Render asset html failed: %O', error);
        res.status(500).json({
            code: 'studio.api.store.html.failed',
            message: `Render asset html failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:creator/:id', async (req, res) => {
    try {
        if (!req.params.id || !req.params.creator) {
            res.status(400).json({
                code: 'vitruveo.studio.api.admin.assets.store.badRequest',
                message: 'Bad request',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creator = await modelCreator.findOneCreator({
            query: { username: req.params.creator },
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.creatorNotFound',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (creator._id.toString() !== asset.framework.createdBy?.toString()) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.assets.store.unauthorized',
                message: 'This asset is not created by this creator',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (!['active', 'hidden'].includes(asset.consignArtwork.status)) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.assets.store.unauthorized',
                message: 'Unauthorized access',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.store.success',
            message: 'Store asset success',
            transaction: nanoid(),
            data: asset,
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('store asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.store.failed',
            message: `Store asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:creator/:id/mint', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');

        const assetExists = await model.findAssetsById({ id: req.params.id });
        if (!assetExists) {
            res.write('event: error');
            res.write(`id: ${nanoid()}\n`);
            res.write(
                `data: ${JSON.stringify({
                    code: 'vitruveo.studio.api.admin.assets.store.notFound',
                    message: 'Asset not found',
                    transaction: nanoid(),
                })}\n\n`
            );
            res.end();
        }

        const creatorExists = await model.findAssetCreatedBy({
            id: req.params.creator,
        });
        if (!creatorExists) {
            res.write('event: error');
            res.write(`id: ${nanoid()}\n`);
            res.write(
                `data: ${JSON.stringify({
                    code: 'vitruveo.studio.api.admin.assets.store.creatorNotFound',
                    message: 'Creator not found',
                    transaction: nanoid(),
                })}\n\n`
            );
            res.end();
        }

        /*
            -> nik codes here <-
        */

        res.write('event: mint asset');
        res.write(`id: ${nanoid()}\n`);
        res.write(
            `data: ${JSON.stringify({
                code: 'vitruveo.studio.api.admin.assets.store.success',
                message: 'Store mint asset success',
                transaction: nanoid(),
            })}\n\n`
        );
    } catch (error) {
        logger('Search profile failed: %O', error);
        res.write('event: event_error\n');
        res.write(`id: ${nanoid()}\n`);
        res.end();
    }
});

export { route };
