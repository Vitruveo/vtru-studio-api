import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import {
    schemaValidationArtworks,
    schemaValidationForCreateStores,
    schemaValidationOrganization,
    schemaValidationStepName,
} from './schemas';
import { FrameworkSchema } from '../model';
import reservedWords from '../../../../reservedWords.json';

export const validateBodyForCreateStores = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.stores.create.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForCreateStores.parse(req.body);

        if (reservedWords.includes(req.body.organization.url)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.stores.create.failed',
                message: 'URL contains a reserved word',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const framework = FrameworkSchema.parse({
            createdBy: req.auth.id,
            updatedBy: req.auth.id,
        });

        req.body.framework = framework;

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.stores.create.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUpdateStepStores = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PATCH') {
        res.status(405).json({
            code: 'vitruveo.studio.api.stores.update.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        schemaValidationStepName.parse(req.body);

        if (req.body.stepName === 'organization') {
            req.body.data = schemaValidationOrganization.parse(req.body.data);
        }
        if (req.body.stepName === 'artworks') {
            req.body.data = schemaValidationArtworks.parse(req.body.data);
        }
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.stores.update.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
