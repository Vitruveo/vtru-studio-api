import debug from 'debug';
import { nanoid } from 'nanoid';

import { Router } from 'express';

import type { APIResponse } from '../../../services/express';
import * as model from '../model';

const logger = debug('features:creators:controller:avatar');
const route = Router();

route.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const creator = await model.findOneCreator({ query: { username } });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.creator.get.creatorNotFound',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (!creator.profile.avatar) {
            res.status(404).json({
                code: 'vitruveo.studio.api.creator.get.avatarNotFound',
                message: 'Avatar not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.creator.get.avatar.success',
            message: 'Get avatar success',
            transaction: nanoid(),
            data: creator.profile.avatar,
        } as APIResponse<string>);
    } catch (error) {
        logger('Get avatar failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.get.avatar.failed',
            message: `Get avatar failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
