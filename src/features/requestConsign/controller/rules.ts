import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { APIResponse } from '../../../services';
import {
    schemaValidationForPatch,
    schemaValidationForPatchComments,
    schemaValidationForPatchCommentsVisility,
} from './schemas';

export const validateBodyForPatch = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PATCH') {
        res.status(405).json({
            code: 'vitruveo.studio.api.requestConsign.validateBodyForPatch.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForPatch.parse(req.body);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.requestConsign.validateBodyForPatch.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForPatchComments = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PATCH') {
        res.status(405).json({
            code: 'vitruveo.studio.api.requestConsign.validateBodyForPatch.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForPatchComments.parse(req.body);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.requestConsign.validateBodyForPatch.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForPatchCommentsVisibility = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PATCH') {
        res.status(405).json({
            code: 'vitruveo.studio.api.requestConsign.validateBodyForPatch.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForPatchCommentsVisility.parse(req.body);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.requestConsign.validateBodyForPatch.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
