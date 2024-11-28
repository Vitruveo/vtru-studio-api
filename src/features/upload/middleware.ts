import { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { nanoid } from 'nanoid';
import * as model from '../creators/model';
import { APIResponse } from '../../services';

export async function checkMd5Hash(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const creatorId = req.auth.id;
    const { title } = req.body;

    const hash = crypto
        .createHash('md5')
        .update(`${title}${creatorId}`)
        .digest('hex');

    const checkHash = await model.checkHashAlreadyExists({ hash });

    if (checkHash.length > 0) {
        return res.status(400).json({
            code: 'vitruveo.studio.api.upload.hash.exists',
            message: 'This Grid already exists',
            transaction: nanoid(),
        } as APIResponse);
    }

    req.body.hash = hash;
    return next();
}
