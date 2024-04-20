import debug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { ethers } from 'ethers';
import { getConnection } from '@nsfilho/redis-connection';

import { keyRedisRequest } from '../utils/keyRedisRequest';
import { APIResponse } from '../../../services';

const logger = debug('features:middleware:authenticateSignature');

export const authenticateSignature = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { wallet, signature } = req.body;

        const redis = await getConnection();
        const nonce = await redis.get(keyRedisRequest(wallet));

        if (!nonce) {
            res.status(401).json({
                code: 'vitruveo.studio.api.auth.signature.invalid',
                message: 'Wallet not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const signerAddress = ethers.verifyMessage(nonce, signature);

        if (signerAddress !== wallet) {
            res.status(401).json({
                code: 'vitruveo.studio.api.auth.signature.invalid',
                message: 'Signature verification failed',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        next();
    } catch (error) {
        logger('Failed to authenticate signature: %O', error);
        res.status(401).json({
            code: 'vitruveo.studio.api.auth.signature.invalid',
            message: 'Signature is invalid',
            transaction: nanoid(),
        } as APIResponse);
    }
};
