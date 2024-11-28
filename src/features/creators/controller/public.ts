import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { APIResponse } from '../../../services';

import * as model from '../model';
import * as modelAsset from '../../assets/model';
import { querySortStacks } from '../utils/queries';
import { DIST } from '../../../constants';
import { StackSpotlight } from './types';
import { SYNAPS_API_KEY } from '../../../constants/synaps';
import { sendToExchangeCreators } from '../upload';

const logger = debug('features:creators:controller:public');
const route = Router();

route.get('/stacks', async (req, res) => {
    try {
        const sort = (req.query.sort as string) || 'latest';
        const page = parseInt(req.query.page as string, 10) || 1;
        let limit = parseInt(req.query.limit as string, 10) || 25;

        if (limit > 200) limit = 200;
        const sortQuery = querySortStacks(sort);

        const query = {
            search: { $exists: true },
        };

        const stacks = await model.findCreatorsStacks({
            query,
            skip: (page - 1) * limit,
            limit,
            sort: sortQuery,
        });
        const totalStacks = await model.countCreatorStacks({ query });

        res.json({
            code: 'vitruveo.studio.api.creators.stack.success',
            message: 'Reader stack success',
            transaction: nanoid(),
            data: {
                data: stacks,
                page,
                totalPage: Math.ceil(totalStacks / limit),
                total: totalStacks,
                limit,
            },
        } as APIResponse);
    } catch (error) {
        logger('Reader stack creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creators.stack.failed',
            message: 'Reader stack failed',
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const creator = await model.findCreatorByUsername({ username });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.creators.profile.notFound',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const query = {
            'framework.createdBy': creator._id.toString(),
            'consignArtwork.status': 'active',
        };

        const artsQuantity = await modelAsset.countArtsByCreator({ query });

        res.json({
            code: 'vitruveo.studio.api.creators.profile.success',
            message: 'Get creator success',
            transaction: nanoid(),
            data: {
                id: creator._id,
                username: creator.username,
                avatar: creator.profile.avatar,
                socials: creator.socials,
                artsQuantity,
            },
        } as APIResponse);
    } catch (error) {
        logger('Get creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creators.profile.failed',
            message: 'Get creator failed',
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/stackSpotlight', async (req, res) => {
    try {
        const stacksSpotlight = await readFile(
            join(DIST, 'stackSpotlight.json'),
            'utf-8'
        );
        const payload = JSON.parse(stacksSpotlight) as StackSpotlight[];

        res.json({
            code: 'vitruveo.studio.api.creators.stackSpotlight.success',
            message: 'Reader stack spotlight success',
            transaction: nanoid(),
            data: payload,
        } as APIResponse);
    } catch (error) {
        logger('Reader stack spotlight failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creators.stackSpotlight.failed',
            message: `Reader stack spotlight failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/synaps/steps', async (req, res) => {
    try {
        const { apiKey } = req.params as { apiKey: string };
        if (apiKey !== SYNAPS_API_KEY) {
            res.status(401).json({
                code: 'vitruveo.studio.api.creator.post.synaps.steps.failed',
                message: 'Unauthorized',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }
        const {
            session_id: sessionId,
            step_id: stepId,
            service: stepName,
            status,
        } = req.body;

        await model.changeStepsSynaps({
            sessionId,
            stepId,
            status,
            stepName,
        });

        const creator = await model.findOneCreator({
            query: {
                'synaps.sessionId': sessionId,
            },
        });

        if (creator) {
            await sendToExchangeCreators(
                JSON.stringify({
                    creatorId: creator._id,
                    sessionId,
                    stepId,
                    status,
                    stepName,
                    messageType: 'synapsSteps',
                }),
                'userNotification'
            );
        }

        res.json({
            code: 'vitruveo.studio.api.creator.post.synaps.steps.success',
            message: 'Post synaps steps success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Synaps steps failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.post.synaps.steps.failed',
            message: `post synaps steps failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
