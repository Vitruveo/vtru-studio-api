import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import {
    schemaValidationForUpload,
    schemaValidationForUploadWithFile,
} from './schemas';

export const validateBodyForUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.upload.validateBodyForUpload.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForUpload.parse(req.body);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.upload.validateBodyForUpload.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUploadWithFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.upload.validateBodyForUploadWithFile.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForUploadWithFile.parse(req.body);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.upload.validateBodyForUploadWithFile.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
