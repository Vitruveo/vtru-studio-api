import { Router } from 'express';
import axios from 'axios';
import { nanoid } from 'nanoid';
import debug from 'debug';
import { middleware } from '../../users';
import type { APIResponse } from '../../../services/express';
import { SYNAPS_API_KEY } from '../../../constants/synaps';
import { findCreatorById, synapsSessionInit } from '../model';

const logger = debug('features:creators:controller:synaps');
const route = Router();

const headers = {
    'Api-Key': SYNAPS_API_KEY,
    'Content-Type': 'application/json',
};

route.post('/session/init', middleware.checkAuth, async (req, res) => {
    try {
        const { id } = req.auth;
        const creator = await findCreatorById({ id });

        if (creator?.synaps?.sessionId) {
            res.json({
                code: 'vitruveo.studio.api.creator.post.synaps.session.init.success',
                message: 'Post synaps session init success',
                transaction: nanoid(),
                data: {
                    session_id: creator.synaps.sessionId,
                },
            } as APIResponse);
            return;
        }

        const synapsRes = await axios.post(
            'https://api.synaps.io/v4/session/init',
            {},
            {
                headers,
            }
        );

        if (synapsRes.status === 200) {
            await synapsSessionInit({
                sessionId: synapsRes.data.session_id,
                creatorId: id,
            });
            res.json({
                code: 'vitruveo.studio.api.creator.post.synaps.session.init.success',
                message: 'Post synaps session init success',
                transaction: nanoid(),
                data: synapsRes.data,
            } as APIResponse);
        } else {
            res.status(500).json({
                code: 'vitruveo.studio.api.creator.post.synaps.session.init.failed',
                message: `post synaps session init failed: ${synapsRes.statusText}`,
                args: synapsRes.statusText,
                transaction: nanoid(),
            } as APIResponse);
        }
    } catch (error) {
        logger('Synaps session init failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.post.synaps.session.init.failed',
            message: `post synaps session init failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/individual/session', middleware.checkAuth, async (req, res) => {
    try {
        const { id } = req.auth;
        const creator = await findCreatorById({ id });

        if (!creator || !creator.synaps?.sessionId) {
            res.status(404).json({
                code: 'vitruveo.studio.api.creator.get.synaps.individual.session.not.found',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        let url = `https://api.synaps.io/v4/individual/session/${creator.synaps.sessionId}`;

        if (req.params.stepId) {
            url += `/step/${req.params.stepId}`;
        }

        const synapsRes = await axios.get(url, {
            headers,
        });

        res.json({
            code: 'vitruveo.studio.api.creator.get.synaps.individual.session.success',
            message: 'Get synaps individual session success',
            transaction: nanoid(),
            data: synapsRes.data,
        } as APIResponse);
    } catch (error) {
        logger('Synaps individual session failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.get.synaps.individual.session.failed',
            message: `Get synaps individual session failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };