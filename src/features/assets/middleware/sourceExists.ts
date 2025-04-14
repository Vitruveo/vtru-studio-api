import { NextFunction, Request, Response } from 'express';
import debug from 'debug';
import { nanoid } from 'nanoid';

import { APIResponse } from '../../../services';

const logger = debug('features:assets:middlewares:sourceExists');

export const checkSourceExists = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { source } = req.query as { source: string };

        if (!source) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.get.error',
                transaction: nanoid(),
                message: 'Source not found',
            } as APIResponse);
            return;
        }

        next();
    } catch (error) {
        logger('Error checking source existence:', error);

        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.error',
            transaction: nanoid(),
            message: 'Source not found',
            args: {
                source: req.query.source,
            },
        } as APIResponse);
    }
};
