import debug from 'debug';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { Router } from 'express';

import type { APIResponse } from '../../../services/express';
import * as model from '../model';
import { validateBodyForGenerateStackSlideshow } from './rules';
import { schemaValidationForGenerateStackSlideshow } from './schemas';
import { middleware } from '../../users';

const logger = debug('features:creators:controller:stack');
const route = Router();

route.use(middleware.checkAuth);

route.post(
    '/slideshow',
    validateBodyForGenerateStackSlideshow,
    async (req, res) => {
        try {
            const { assets, display, fees, interval, title } =
                req.body as z.infer<
                    typeof schemaValidationForGenerateStackSlideshow
                >;

            const id = Date.now().toString();

            await model.updateCreatorSearchSlideshow({
                id: req.auth.id,
                slideshow: {
                    id,
                    assets,
                    display,
                    fees,
                    interval,
                    title,
                },
            });

            res.json({
                code: 'vitruveo.studio.api.creator.generate.stack.success',
                message: 'generate stack success',
                transaction: nanoid(),
                data: id,
            } as APIResponse<string>);
        } catch (error) {
            logger('generate stack failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.creator.generate.stack.failed',
                message: `generate stack failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
