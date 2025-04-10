import { NextFunction, Request, Response } from 'express';
import debug from 'debug';
import { nanoid } from 'nanoid';

import { exists } from '../../../services/aws';
import { APIResponse } from '../../../services';
import { PRINT_OUTPUTS_STORAGE_NAME } from '../../../constants';

const logger = debug('features:assets:middlewares:printOutputExists');

export const checkPrintOutputExists = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { source } = req.query as { source: string };

        const key = `${id}/${source.split('assets/')[1]}`.replace(
            'png',
            'jpeg'
        );

        const existingUrl = await exists({
            bucketUrl: `https://${PRINT_OUTPUTS_STORAGE_NAME}.s3.amazonaws.com`,
            key,
        });

        if (existingUrl) {
            res.redirect(
                `https://${PRINT_OUTPUTS_STORAGE_NAME}.s3.amazonaws.com/${key}`
            );
            return;
        }

        res.locals.sourceKey = key;

        next();
    } catch (error) {
        logger('Error checking print output existence:', error);

        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.error',
            transaction: nanoid(),
            message: 'Print output not found',
        } as APIResponse);
    }
};
