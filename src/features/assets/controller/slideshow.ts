import debug from 'debug';
import { nanoid } from 'nanoid';
import { Document, ObjectId } from 'mongodb';

import { Router } from 'express';

import type { APIResponse } from '../../../services/express';
import * as model from '../model';
import * as modelCreator from '../../creators/model';

const logger = debug('features:assets:controller:slideshow');
const route = Router();

route.get('/:timestamp', async (req, res) => {
    try {
        const slideshow = await modelCreator.findCreatorAssetsBySlideshowId({
            id: req.params.timestamp,
        });

        if (!slideshow || !slideshow.search) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.slideshow.not_found',
                message: 'Slideshow not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (
            Array.isArray(slideshow?.search?.slideshow) &&
            slideshow?.search?.slideshow.length === 0
        ) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.slideshow.not_found',
                message: 'Slideshow not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const assets = await model.findAssetsFromSlideshow({
            query: {
                _id: {
                    $in: slideshow.search.slideshow[0].assets.map(
                        (id) => new ObjectId(id)
                    ),
                },
            },
        });

        res.json({
            code: 'vitruveo.studio.api.assets.get.slideshow.success',
            message: 'Get slideshow success',
            transaction: nanoid(),
            data: assets,
        } as APIResponse<Document[]>);
    } catch (error) {
        logger('Get slideshow failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.slideshow.failed',
            message: `Get slideshow failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
