import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import {
    createRecordFramework,
    defaultRecordFramework,
    updateRecordFramework,
} from '../../common/record';
import {
    schemaValidationForAdd,
    schemaValidationForCreate,
    schemaValidationForUpdate,
} from './schemas';

export const validateBodyForAdd = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.features.validateBodyForAdd.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForAdd.parse(req.body);
        req.body.framework = defaultRecordFramework();
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.features.validateBodyForAdd.failed',
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
            code: 'vitruveo.studio.api.features.validateBodyForUpdate.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForUpdate.parse(req.body);
        req.body.framework = updateRecordFramework({
            framework: req.body.framework,
            updatedBy: req.auth.id,
        });
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.features.validateBodyForUpdate.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForCreate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.features.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body.framework = createRecordFramework({
            createdBy: req.auth.id,
        });
        req.body = schemaValidationForCreate.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.features.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
