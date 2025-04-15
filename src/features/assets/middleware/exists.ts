import { nanoid } from 'nanoid';
import { Request, Response, NextFunction } from 'express';
import debug from 'debug';

import * as model from '../model/db';
import { APIResponse } from '../../../services';

const logger = debug('features:assets:middlewares:exists');

export const checkAssetExists = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

        res.locals.asset = asset;
        res.locals.assetId = id;

        next();
    } catch (error) {
        logger('Error checking asset existence:', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.error',
            transaction: nanoid(),
            message: 'Asset not found',
        } as APIResponse);
    }
};
