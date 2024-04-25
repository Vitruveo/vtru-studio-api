import debug from 'debug';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { getConnection } from '@nsfilho/redis-connection';
import { Router } from 'express';

import type { APIResponse } from '../../../services/express';
import type { AuthResponse } from './types';
import { CreatorDocument, checkWalletExists } from '../model';
import { validateBodyForRequestConnect } from './rules';
import { keyRedisRequest } from '../utils/keyRedisRequest';
import { authenticateSignature } from '../middleware/authenticateSignature';

export interface LoginAnswer {
    token: string;
    creator: Partial<CreatorDocument>;
}

const logger = debug('features:creators:controller:connect');
const route = Router();

route.post('/request', validateBodyForRequestConnect, async (req, res) => {
    try {
        const { wallet } = req.body;
        const nonce = `Welcome to Vitruveo Studio: 
${uuidv4()}`;

        const redis = await getConnection();
        await redis.set(keyRedisRequest(wallet), nonce, 'EX', 60 * 30); // 30 minutes

        res.status(200).json({
            code: 'vitruveo.studio.api.requestConnect.success',
            message: 'Request connect success',
            transaction: nanoid(),
            data: { nonce },
        } as APIResponse<AuthResponse>);
    } catch (error) {
        logger('Failed to request connect: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConnect.failed',
            message: `Failed to request connect: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/verify', authenticateSignature, async (req, res) => {
    try {
        const { wallet } = req.body;
        const walletExists = await checkWalletExists({ address: wallet });

        if (walletExists) {
            res.status(400).json({
                code: 'vitruveo.studio.api.verifyConnect.failed',
                message: 'Wallet already exists',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.status(200).json({
            code: 'vitruveo.studio.api.connect.success',
            message: 'Connect success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Failed to connect: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.connect.failed',
            message: `Connect failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
