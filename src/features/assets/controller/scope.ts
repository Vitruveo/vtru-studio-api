import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { APIResponse } from '../../../services';
import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';

const logger = debug('features:assets:controller:scope');
const route = Router();

route.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await model.findAssetsById({ id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.notFound',
                message: 'Reader get asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (!asset.framework.createdBy) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.creatorNotFound',
                message: 'Reader get asset creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creator = await modelCreator.findCreatorById({
            id: asset.framework.createdBy,
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.creatorNotFound',
                message: 'Reader get asset creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const previewUrl = `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`;
        const storeUrl = `${STORE_URL}/${
            creator.username
        }/${asset._id.toString()}/${Date.now()}`;

        res.json({
            previewUrl,
            storeUrl,
        });
    } catch (error) {
        logger('Reader get asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.failed',
            message: `Reader get asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
