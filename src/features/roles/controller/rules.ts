import { nanoid } from 'nanoid';
import debug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import { createRecordFramework } from '../../common/record';
import {
    schemaValidationForCreate,
    schemaValidationForUpdate,
} from './schemas';

const logger = debug('features:roles:controller:rules');

export const validateBodyForCreate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.roles.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForCreate.parse(req.body);
        req.body.framework = createRecordFramework({
            createdBy: req.auth.id,
        });
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.roles.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PUT') {
        res.status(405).json({
            code: 'vitruveo.studio.api.roles.validateBodyForUpdate.failed',
            message: 'method not allowed',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForUpdate.parse(req.body);

        next();
    } catch (error) {
        logger('Failed to validate body from validateBodyForUpdate: %O', error);
        res.status(400).json({
            code: 'vitruveo.studio.api.roles.validateBodyForUpdate.failed',
            message: 'Failed to validate body',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
