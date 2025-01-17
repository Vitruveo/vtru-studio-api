import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import debug from 'debug';

import { APIResponse } from '../../../services';
import {
    schemaValidationArtworks,
    schemaValidationForCreateStores,
    schemaValidationOrganization,
    schemaValidationStepName,
} from './schemas';
import { FrameworkSchema } from '../model';
import { GENERAL_STORAGE_URL } from '../../../constants';

const logger = debug('features:stores:controller:rules');

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
        const { url } = req.body.organization;

        if (!url.match(/^[a-zA-Z0-9-]+$/) || url.length < 4) {
            logger(
                'URL must be at least 4 characters and contain only letters, numbers, and hyphens'
            );
            res.status(400).json({
                code: 'vitruveo.studio.api.stores.create.failed',
                message:
                    'URL must be at least 4 characters and contain only letters, numbers, and hyphens',
                transaction: nanoid(),
                args: { url },
            } as APIResponse);
            return;
        }

        const reservedWords = await axios.get(
            `${GENERAL_STORAGE_URL}/reservedWords.json`
        );
        if (reservedWords.data.includes(url)) {
            logger('URL contains a reserved word');
            res.status(400).json({
                code: 'vitruveo.studio.api.stores.create.failed',
                message: 'URL contains a reserved word',
                transaction: nanoid(),
                args: { url },
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
        logger('Error validating body for create stores', error);
        res.status(400).json({
            code: 'vitruveo.studio.api.stores.create.failed',
            message: error instanceof Error ? error.message : '',
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
        logger('Error validating body for update step stores', error);
        res.status(400).json({
            code: 'vitruveo.studio.api.stores.update.failed',
            message: error instanceof Error ? error.message : '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
